import type {
  PrismaClient,
} from "@prisma/client";

import {
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto";

import bcrypt from "bcryptjs";
import { z } from "zod";

import {
  FRENCH_WARD_ACTION,
  resolveFrenchWardActionAuthorityWithClient,
} from "../governance/resolveFrenchWardActionAuthorityWithClient";

import {
  FRENCH_WARD_COMMERCIAL_INTAKE,
} from "./canonicalCommercialIntake";

export const FRENCH_WARD_GOVERNING_LOI_POLICY =
  "FRENCH_WARD_GOVERNING_LOI_ACCESS_V1" as const;

export const FRENCH_WARD_SEND_LOI_CONFIRMATION =
  "SEND FRENCH-WARD LOI" as const;

const inputSchema = z.object({
  recipientName:
    z.string().trim().min(1).max(120),

  recipientEmail:
    z.string().trim().toLowerCase().email().max(254),

  recipientOrganization:
    z.string().trim().min(1).max(180),

  purpose:
    z.string().trim().min(1).max(1000),

  idempotencyKey:
    z.string().uuid(),
}).strict();

export class FrenchWardLoiInvitationError
  extends Error {
  constructor(
    public readonly code: string,
  ) {
    super(code);
    this.name =
      "FrenchWardLoiInvitationError";
  }
}

export async function createFrenchWardLoiInvitationWithClient(
  input: {
    client: PrismaClient;
    actorUserId: string;
    confirmation: string;
    fields: z.input<typeof inputSchema>;
  },
) {
  const actorUserId =
    input.actorUserId.trim();

  const parsed =
    inputSchema.safeParse(input.fields);

  if (
    !actorUserId ||
    actorUserId.length > 191 ||
    !parsed.success
  ) {
    throw new FrenchWardLoiInvitationError(
      "FW_LOI_INVITATION_INVALID",
    );
  }

  if (
    input.confirmation !==
    FRENCH_WARD_SEND_LOI_CONFIRMATION
  ) {
    throw new FrenchWardLoiInvitationError(
      "FW_LOI_CONFIRMATION_REQUIRED",
    );
  }

  if (
    FRENCH_WARD_COMMERCIAL_INTAKE.status !==
    "CURRENT"
  ) {
    throw new FrenchWardLoiInvitationError(
      "FW_LOI_INTAKE_UNAVAILABLE",
    );
  }

  /*
   * Fail before recipient provisioning or any other persistence.
   */
  const initialAuthority =
    await resolveFrenchWardActionAuthorityWithClient({
      client: input.client,
      userId: actorUserId,
      action:
        FRENCH_WARD_ACTION.SEND_LOI,
    });

  if (!initialAuthority.allowed) {
    throw new FrenchWardLoiInvitationError(
      "FW_LOI_SEND_AUTHORITY_REQUIRED",
    );
  }

  const data = parsed.data;

  const inputHash =
    createHash("sha256")
      .update(JSON.stringify({
        actorUserId,
        recipientName:
          data.recipientName,
        recipientEmail:
          data.recipientEmail,
        recipientOrganization:
          data.recipientOrganization,
        purpose:
          data.purpose,
      }))
      .digest("hex");

  /*
   * Password exists only because User currently requires one.
   * Recipient authentication will be replaced by the 1E invitation bridge.
   */
  const passwordHash =
    await bcrypt.hash(
      randomBytes(48).toString("hex"),
      12,
    );

  return input.client.$transaction(
    async (tx) => {
      await tx.$queryRaw`
        SELECT pg_advisory_xact_lock(
          hashtextextended(
            ${"FW_GOVERNING_LOI:" + actorUserId},
            0
          )
        ) IS NULL AS locked
      `;

      const previous =
        await tx.frenchWardLoiInvitation.findUnique({
          where: {
            actorUserId_idempotencyKey: {
              actorUserId,
              idempotencyKey:
                data.idempotencyKey,
            },
          },
        });

      if (previous) {
        if (
          previous.inputHash !==
          inputHash
        ) {
          throw new FrenchWardLoiInvitationError(
            "FW_LOI_IDEMPOTENCY_CONFLICT",
          );
        }

        return {
          invitation: previous,
          replay: true,
        };
      }

      /*
       * Authority is re-proven inside the same transaction that
       * creates recipient identity, request, grant and invitation.
       */
      const authority =
        await resolveFrenchWardActionAuthorityWithClient({
          client: tx,
          userId: actorUserId,
          action:
            FRENCH_WARD_ACTION.SEND_LOI,
        });

      if (!authority.allowed) {
        throw new FrenchWardLoiInvitationError(
          "FW_LOI_SEND_AUTHORITY_REQUIRED",
        );
      }

      await tx.$queryRaw`
        SELECT pg_advisory_xact_lock(
          hashtextextended(
            ${data.recipientEmail},
            0
          )
        ) IS NULL AS locked
      `;

      const matches =
        await tx.user.findMany({
          where: {
            email: {
              equals:
                data.recipientEmail,
              mode:
                "insensitive",
            },
          },
          select: {
            id: true,
            email: true,
          },
        });

      if (
        matches.length > 1 ||
        (
          matches.length === 1 &&
          matches[0].email !==
            data.recipientEmail
        )
      ) {
        throw new FrenchWardLoiInvitationError(
          "FW_LOI_RECIPIENT_RECONCILIATION_REQUIRED",
        );
      }

      const recipient =
        await tx.user.upsert({
          where: {
            email:
              data.recipientEmail,
          },

          update: {},

          create: {
            username:
              "institutional-visitor-" +
              randomUUID(),

            email:
              data.recipientEmail,

            passwordHash,

            displayName:
              data.recipientName,

            viewedDocs: [],
            isAdmin: false,
          },

          select: {
            id: true,
          },
        });

      const issuedAt =
        new Date();

      const expiresAt =
        new Date(
          issuedAt.getTime() +
          7 * 24 * 60 * 60 * 1000,
        );

      const invitationId =
        randomUUID();

      const request =
        await tx.institutionalAccessRequest.create({
          data: {
            requesterName:
              data.recipientName,

            requesterEmail:
              data.recipientEmail,

            institutionalAffiliation:
              data.recipientOrganization,

            requesterCapacity:
              "INVITED_FRENCH_WARD_LOI_RECIPIENT",

            purpose:
              data.purpose,

            scope:
              FRENCH_WARD_COMMERCIAL_INTAKE
                .accessScope,

            resourceReference:
              FRENCH_WARD_COMMERCIAL_INTAKE
                .reference,

            resourceVersion:
              FRENCH_WARD_COMMERCIAL_INTAKE
                .version,

            status:
              "APPROVED",

            decisionPolicy:
              FRENCH_WARD_GOVERNING_LOI_POLICY,

            decisionReason:
              "Named-recipient Commercial Intake invitation issued under French-Ward governing SEND_LOI authority.",

            decidedByUserId:
              actorUserId,

            decidedAt:
              issuedAt,

            events: {
              create: [
                {
                  type:
                    "REQUESTED",

                  actorUserId,

                  metadata: {
                    origin:
                      "FRENCH_WARD_GOVERNING_LOI_INVITATION",

                    invitationId,

                    governingReference:
                      authority.standing.reference,

                    policy:
                      FRENCH_WARD_GOVERNING_LOI_POLICY,
                  },
                },
                {
                  type:
                    "APPROVED",

                  actorUserId,
                },
              ],
            },
          },

          select: {
            id: true,
          },
        });

      const grant =
        await tx.institutionalAccessGrant.create({
          data: {
            requestId:
              request.id,

            recipientUserId:
              recipient.id,

            recipientEmail:
              data.recipientEmail,

            scope:
              FRENCH_WARD_COMMERCIAL_INTAKE
                .accessScope,

            resourceReference:
              FRENCH_WARD_COMMERCIAL_INTAKE
                .reference,

            resourceVersion:
              FRENCH_WARD_COMMERCIAL_INTAKE
                .version,

            issuedByUserId:
              actorUserId,

            issuedAt,
            expiresAt,
          },

          select: {
            id: true,
          },
        });

      await tx.institutionalAccessEvent.create({
        data: {
          requestId:
            request.id,

          grantId:
            grant.id,

          type:
            "GRANTED",

          actorUserId,

          metadata: {
            origin:
              "FRENCH_WARD_GOVERNING_LOI_INVITATION",

            invitationId,

            policy:
              FRENCH_WARD_GOVERNING_LOI_POLICY,

            governingReference:
              authority.standing.reference,

            recipientProvisioned:
              matches.length === 0,
          },
        },
      });

      const invitation =
        await tx.frenchWardLoiInvitation.create({
          data: {
            id:
              invitationId,

            actorUserId,

            governingReference:
              authority.standing.reference,

            requestId:
              request.id,

            grantId:
              grant.id,

            recipientUserId:
              recipient.id,

            recipientName:
              data.recipientName,

            recipientEmail:
              data.recipientEmail,

            recipientOrganization:
              data.recipientOrganization,

            purpose:
              data.purpose,

            policy:
              FRENCH_WARD_GOVERNING_LOI_POLICY,

            inputHash,

            idempotencyKey:
              data.idempotencyKey,

            expiresAt,

            deliveryStatus:
              "QUEUED",
          },
        });

      await tx.domainEvent.create({
        data: {
          streamType:
            "FrenchWardLoiInvitation",

          streamId:
            invitation.id,

          eventType:
            "FRENCH_WARD_LOI_INVITATION_CREATED",

          payload: {
            actorUserId,

            governingReference:
              authority.standing.reference,

            requestId:
              request.id,

            grantId:
              grant.id,

            recipientUserId:
              recipient.id,

            resourceReference:
              FRENCH_WARD_COMMERCIAL_INTAKE
                .reference,

            resourceVersion:
              FRENCH_WARD_COMMERCIAL_INTAKE
                .version,

            policy:
              FRENCH_WARD_GOVERNING_LOI_POLICY,
          },
        },
      });

      return {
        invitation,
        replay: false,
      };
    },
    {
      isolationLevel:
        "Serializable",

      maxWait:
        10000,

      timeout:
        30000,
    },
  );
}
