import type {
  PrismaClient,
} from "@prisma/client";

function required(
  value: string,
  field: string,
) {
  const normalized =
    value.trim();

  if (!normalized) {
    throw new Error(
      `[FW_INSTITUTIONAL_INVITATION_REVOKE_${field.toUpperCase()}_REQUIRED]`,
    );
  }

  return normalized;
}

/**
 * Administratively revoke one French-Ward institutional invitation.
 *
 * Revocation changes the invitation record only.
 *
 * It does NOT:
 * - delete or end an institutional participant;
 * - alter an AXPT User;
 * - revoke a session;
 * - alter governing standing;
 * - alter commercial or instrument authority;
 * - alter institutional resource access.
 *
 * If the invitation had already been accepted, its participant
 * recognition remains a separate durable institutional fact.
 */
export async function
revokeFrenchWardInstitutionalInvitationWithClient(
  params: {
    client:
      PrismaClient;

    reference:
      string;

    revokedByUserId:
      string;

    reason:
      string;

    now?: Date;
  },
) {
  const reference =
    required(
      params.reference,
      "reference",
    );

  const revokedByUserId =
    required(
      params.revokedByUserId,
      "revoked_by_user_id",
    );

  const reason =
    required(
      params.reason,
      "reason",
    );

  const now =
    params.now ??
    new Date();

  if (
    reference.length > 191 ||
    revokedByUserId.length > 191 ||
    reason.length > 1000 ||
    !Number.isFinite(
      now.getTime(),
    )
  ) {
    throw new Error(
      "[FW_INSTITUTIONAL_INVITATION_REVOKE_INPUT_INVALID]",
    );
  }

  return params.client.$transaction(
    async (tx: Pick<
      PrismaClient,
      | "$queryRaw"
      | "domainEvent"
      | "frenchWardInstitutionalInvitation"
      | "user"
    >) => {
      /*
       * Serialize revocation against acceptance and other revocation
       * attempts for this exact invitation.
       */
      await tx.$queryRaw`
        SELECT id
        FROM "FrenchWardInstitutionalInvitation"
        WHERE "reference" = ${reference}
        FOR UPDATE
      `;

      const actor =
        await tx.user.findUnique({
          where: {
            id:
              revokedByUserId,
          },

          select: {
            id: true,
            isAdmin: true,
          },
        });

      if (!actor) {
        throw new Error(
          "[FW_INSTITUTIONAL_INVITATION_REVOKER_NOT_FOUND]",
        );
      }

      if (!actor.isAdmin) {
        throw new Error(
          "[FW_INSTITUTIONAL_INVITATION_REVOKER_NOT_AUTHORIZED]",
        );
      }

      const invitation =
        await tx
          .frenchWardInstitutionalInvitation
          .findUnique({
            where: {
              reference,
            },

            select: {
              id: true,
              reference: true,

              participantReference:
                true,

              acceptedByUserId:
                true,

              acceptedAt:
                true,

              revokedByUserId:
                true,

              revokedAt:
                true,

              revocationReason:
                true,
            },
          });

      if (!invitation) {
        throw new Error(
          "[FW_INSTITUTIONAL_INVITATION_NOT_FOUND]",
        );
      }

      if (invitation.revokedAt) {
        return {
          invitation,
          alreadyRevoked:
            true,
        } as const;
      }

      const revoked =
        await tx
          .frenchWardInstitutionalInvitation
          .update({
            where: {
              id:
                invitation.id,
            },

            data: {
              revokedByUserId,

              revokedAt:
                now,

              revocationReason:
                reason,
            },

            select: {
              id: true,
              reference: true,

              participantReference:
                true,

              acceptedByUserId:
                true,

              acceptedAt:
                true,

              revokedByUserId:
                true,

              revokedAt:
                true,

              revocationReason:
                true,
            },
          });

      await tx.domainEvent.create({
        data: {
          streamType:
            "FrenchWardInstitutionalInvitation",

          streamId:
            invitation.id,

          eventType:
            "FRENCH_WARD_INSTITUTIONAL_INVITATION_REVOKED",

          payload: {
            invitationReference:
              invitation.reference,

            participantReference:
              invitation.participantReference,

            accepted:
              invitation.acceptedAt !==
              null,

            acceptedByUserId:
              invitation.acceptedByUserId,

            reason,
          },

          metadata: {
            actorUserId:
              revokedByUserId,

            source:
              "french-ward.institutional-invitation.revoke",
          },

          occurredAt:
            now,
        },
      });

      return {
        invitation:
          revoked,

        alreadyRevoked:
          false,
      } as const;
    },
  );
}
