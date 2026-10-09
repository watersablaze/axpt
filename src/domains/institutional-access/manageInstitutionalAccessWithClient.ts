import type { PrismaClient } from "@prisma/client";
import type { Principal } from "../auth/types";
import { PERMISSIONS } from "../auth/permissions";
import type { InstitutionalAccessScope } from "./resolveInstitutionalAccessWithClient";

type ManagementTransaction = Pick<
  PrismaClient,
  | "user"
  | "institutionalAccessRequest"
  | "institutionalAccessGrant"
  | "institutionalAccessEvent"
>;

function required(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) throw new Error(`REQUIRED:${label}`);
  return normalized;
}

/**
 * Resource identity and scope must be supplied by the server-owned
 * resource registry. Public fields are assertions for operator review.
 */
export async function requestInstitutionalAccessWithClient(params: {
  client: PrismaClient;
  requesterName: string;
  requesterEmail: string;
  institutionalAffiliation: string;
  requesterCapacity: string;
  purpose: string;
  scope: InstitutionalAccessScope;
  resourceReference: string;
  resourceVersion: number;
}) {
  if (
    !["PROFILE_VIEW", "LOI_INTAKE_ACCESS"].includes(params.scope) ||
    !Number.isInteger(params.resourceVersion) ||
    params.resourceVersion <= 0
  ) {
    throw new Error("INVALID_ACCESS_RESOURCE");
  }

  const email = required(params.requesterEmail, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("INVALID_REQUESTER_EMAIL");
  }

  return params.client.institutionalAccessRequest.create({
    data: {
      requesterName: required(params.requesterName, "name"),
      requesterEmail: email,
      institutionalAffiliation: required(
        params.institutionalAffiliation, "institution",
      ),
      requesterCapacity: required(params.requesterCapacity, "capacity"),
      purpose: required(params.purpose, "purpose"),
      scope: params.scope,
      resourceReference: required(params.resourceReference, "resource"),
      resourceVersion: params.resourceVersion,
      events: {
        create: {
          type: "REQUESTED",
          metadata: { policy: "INDIVIDUAL_OPERATOR_REVIEW_V1" },
        },
      },
    },
    select: { id: true, status: true, createdAt: true },
  });
}

/**
 * actor must come from the canonical authenticated principal.
 * The operator's active permission is rechecked in the transaction.
 * No roles, ARP records, or commercial authority are created here.
 */
export async function decideInstitutionalAccessWithClient(params: {
  client: PrismaClient;
  actor: Principal;
  requestId: string;
  decision: "APPROVED" | "DECLINED";
  reason: string;
  recipientUserId?: string;
  expiresAt?: Date;
}) {
  const requestId = required(params.requestId, "request");
  const reason = required(params.reason, "decision reason");

  if (
    !params.actor.userId ||
    !params.actor.permissions.includes(PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE)
  ) {
    throw new Error("MISSING_PERMISSION:INSTITUTIONAL_ACCESS_MANAGE");
  }

  if (!["APPROVED", "DECLINED"].includes(params.decision)) {
    throw new Error("INVALID_ACCESS_DECISION");
  }

  return params.client.$transaction(async (tx: ManagementTransaction) => {
    const operator = await tx.user.findFirst({
      where: {
        id: params.actor.userId,
        userRoles: {
          some: {
            isActive: true,
            revokedAt: null,
            role: {
              rolePermissions: {
                some: {
                  permission: {
                    key: PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE,
                  },
                },
              },
            },
          },
        },
      },
      select: { id: true },
    });

    if (!operator) {
      throw new Error("MISSING_PERMISSION:INSTITUTIONAL_ACCESS_MANAGE");
    }

    const request = await tx.institutionalAccessRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.status !== "PENDING") {
      throw new Error("ACCESS_REQUEST_NOT_PENDING");
    }

    const now = new Date();

    if (params.decision === "APPROVED") {
      if (
        !params.recipientUserId ||
        !params.expiresAt ||
        !Number.isFinite(params.expiresAt.getTime()) ||
        params.expiresAt <= now
      ) {
        throw new Error("RECIPIENT_AND_FUTURE_EXPIRY_REQUIRED");
      }

      const recipient = await tx.user.findUnique({
        where: { id: params.recipientUserId },
        select: { id: true, email: true },
      });

      if (!recipient || recipient.email !== request.requesterEmail) {
        throw new Error("RECIPIENT_EMAIL_MISMATCH");
      }
    }

    const changed = await tx.institutionalAccessRequest.updateMany({
      where: { id: request.id, status: "PENDING" },
      data: {
        status: params.decision,
        decisionPolicy: "INDIVIDUAL_OPERATOR_REVIEW_V1",
        decisionReason: reason,
        decidedByUserId: operator.id,
        decidedAt: now,
      },
    });

    if (changed.count !== 1) {
      throw new Error("ACCESS_REQUEST_ALREADY_DECIDED");
    }

    await tx.institutionalAccessEvent.create({
      data: {
        requestId: request.id,
        type: params.decision,
        actorUserId: operator.id,
        reason,
        occurredAt: now,
      },
    });

    if (params.decision === "DECLINED") {
      return { requestId: request.id, status: "DECLINED", grantId: null };
    }

    const grant = await tx.institutionalAccessGrant.create({
      data: {
        requestId: request.id,
        recipientUserId: params.recipientUserId!,
        recipientEmail: request.requesterEmail,
        scope: request.scope,
        resourceReference: request.resourceReference,
        resourceVersion: request.resourceVersion,
        issuedByUserId: operator.id,
        issuedAt: now,
        expiresAt: params.expiresAt!,
      },
      select: { id: true },
    });

    await tx.institutionalAccessEvent.create({
      data: {
        requestId: request.id,
        grantId: grant.id,
        type: "GRANTED",
        actorUserId: operator.id,
        occurredAt: now,
      },
    });

    return {
      requestId: request.id,
      status: "APPROVED",
      grantId: grant.id,
    };
  });
}
