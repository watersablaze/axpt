import type { PrismaClient } from "@prisma/client";

type InstitutionalAccessTransactionClient = Pick<
  PrismaClient,
  | "$queryRaw"
  | "user"
  | "institutionalAccessGrant"
  | "institutionalAccessEvent"
  | "transactionIntake"
>;
import type { Principal } from "../auth/types";
import {
  resolveInstitutionalAccessWithClient,
  type InstitutionalAccessIdentity,
  type InstitutionalAccessScope,
} from "./resolveInstitutionalAccessWithClient";

export class InstitutionalAccessDeniedError extends Error {
  constructor() {
    super("INSTITUTIONAL_ACCESS_DENIED");
    this.name = "InstitutionalAccessDeniedError";
  }
}

/**
 * All protected mutations and grant revocations use this same
 * recipient lock. Access is resolved again after acquiring it.
 * External side effects must run only after the transaction commits.
 */
async function lockRecipient(
  tx: InstitutionalAccessTransactionClient,
  userId: string,
) {
  await tx.$queryRaw`
    SELECT "id" FROM "User"
    WHERE "id" = ${userId}
    FOR UPDATE
  `;
}

export async function consumeInstitutionalAccessWithClient<T>(params: {
  client: PrismaClient;
  identity: InstitutionalAccessIdentity;
  scope: InstitutionalAccessScope;
  action: "SUBMIT_INTAKE";
  resourceReference: string;
  resourceVersion: number;
  execute: (
    tx: InstitutionalAccessTransactionClient,
  ) => Promise<{ value: T; intakeId: string; intakeReference: string }>;
}): Promise<T> {
  return params.client.$transaction(async (tx: InstitutionalAccessTransactionClient) => {
    await lockRecipient(tx, params.identity.userId);
    if (params.scope === "LOI_INTAKE_ACCESS") {
      // Hold parent invitations stable through the protected submission.
      // A concurrent dossier revocation waits for this transaction to finish.
      await tx.$queryRaw`SELECT d.id FROM "RepresentativeBuyerDossier" d
        JOIN "InstitutionalAccessGrant" g ON g.id = d."loiAccessGrantId"
        WHERE g."recipientUserId" = ${params.identity.userId}
        ORDER BY d.id FOR SHARE OF d`;
    }

    const now = new Date();
    const access = await resolveInstitutionalAccessWithClient({
      client: tx,
      identity: params.identity,
      scope: params.scope,
      action: params.action,
      resourceReference: params.resourceReference,
      resourceVersion: params.resourceVersion,
      now,
    });

    if (!access.allowed) {
      throw new InstitutionalAccessDeniedError();
    }

    const result = await params.execute(tx);

    await tx.institutionalAccessGrant.update({
      where: { id: access.grant.id },
      data: {
        lastAccessAt: now,
      },
    });

    await tx.institutionalAccessGrant.updateMany({
      where: { id: access.grant.id, firstAccessAt: null },
      data: { firstAccessAt: now },
    });

    await tx.institutionalAccessEvent.create({
      data: {
        requestId: access.grant.requestId,
        grantId: access.grant.id,
        type: "INTAKE_SUBMITTED",
        actorUserId: params.identity.userId,
        occurredAt: now,
        metadata: {
          action: params.action,
          resourceReference: params.resourceReference,
          resourceVersion: params.resourceVersion,
          intakeId: result.intakeId,
          intakeReference: result.intakeReference,
        },
      },
    });

    return result.value;
  });
}

export async function revokeInstitutionalAccessWithClient(params: {
  client: PrismaClient;
  actor: Principal;
  grantId: string;
  reason: string;
  /** Optional server-owned scope restriction for a consumer interface. */
  expectedScope?: InstitutionalAccessScope;
}) {
  if (
    !params.actor.userId ||
    !params.actor.permissions.some(
      (permission) => permission === "INSTITUTIONAL_ACCESS_MANAGE",
    )
  ) {
    throw new Error("MISSING_PERMISSION:INSTITUTIONAL_ACCESS_MANAGE");
  }

  const reason = params.reason.trim();
  if (!params.grantId.trim() || !reason) {
    throw new Error("GRANT_AND_REVOCATION_REASON_REQUIRED");
  }

  return params.client.$transaction(async (tx: InstitutionalAccessTransactionClient) => {
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
                  permission: { key: "INSTITUTIONAL_ACCESS_MANAGE" },
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

    const grant = await tx.institutionalAccessGrant.findUnique({
      where: { id: params.grantId },
      select: { recipientUserId: true, scope: true },
    });

    if (!grant) throw new Error("INSTITUTIONAL_ACCESS_GRANT_NOT_FOUND");
    if (params.expectedScope && grant.scope !== params.expectedScope) {
      throw new Error("ACCESS_GRANT_SCOPE_MISMATCH");
    }

    await lockRecipient(tx, grant.recipientUserId);

    const current = await tx.institutionalAccessGrant.findUnique({
      where: { id: params.grantId },
      select: { id: true, requestId: true, revokedAt: true },
    });

    if (!current) throw new Error("INSTITUTIONAL_ACCESS_GRANT_NOT_FOUND");
    if (current.revokedAt) return current;

    const now = new Date();
    const revoked = await tx.institutionalAccessGrant.update({
      where: { id: current.id },
      data: { revokedAt: now },
      select: { id: true, requestId: true, revokedAt: true },
    });

    await tx.institutionalAccessEvent.create({
      data: {
        requestId: current.requestId,
        grantId: current.id,
        type: "REVOKED",
        actorUserId: params.actor.userId,
        reason,
        occurredAt: now,
      },
    });

    return revoked;
  }, {
    maxWait: 10000,
    timeout: 30000,
  });
}
