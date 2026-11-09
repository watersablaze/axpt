import {
  createHash,
  randomBytes,
} from "node:crypto";

import bcrypt from "bcryptjs";

import type {
  PrismaClient,
} from "@prisma/client";

type InvitationAcceptanceTransaction = Pick<
  PrismaClient,
  | "$queryRaw"
  | "user"
  | "frenchWardInstitutionalInvitation"
  | "frenchWardInstitutionalParticipant"
  | "domainEvent"
>;

import {
  hashFrenchWardInstitutionalInvitationCredential,
} from "./institutionalInvitationCredential";

const PASSWORD_HASH_ROUNDS =
  12;

function normalizeEmail(
  value: string,
) {
  return value
    .trim()
    .toLowerCase();
}

function institutionalUsername(
  email: string,
) {
  const suffix =
    createHash("sha256")
      .update(
        email,
        "utf8",
      )
      .digest("hex")
      .slice(0, 24);

  return `institutional-${suffix}`;
}

async function createUnusablePasswordHash() {
  /*
   * French-Ward institutional authentication does not use a password.
   * User.passwordHash remains required by the legacy User schema.
   */
  const secret =
    randomBytes(48)
      .toString("base64url");

  return bcrypt.hash(
    secret,
    PASSWORD_HASH_ROUNDS,
  );
}

/**
 * Accept one French-Ward institutional invitation.
 *
 * ACCEPTED ⇒ IDENTITY BOUND + PARTICIPATION RECOGNIZED.
 *
 * It does NOT imply:
 * - AXPT role assignment;
 * - French-Ward governing standing;
 * - commercial action authority;
 * - instrument authority;
 * - institutional resource access;
 * - Orientation completion;
 * - PIN issuance.
 *
 * All durable state transitions occur inside one database transaction:
 *
 * credential proof
 * → invitation lock
 * → canonical User reconcile/create
 * → participant contradiction checks
 * → participant creation
 * → invitation acceptance
 * → attributable DomainEvent
 */
export async function
acceptFrenchWardInstitutionalInvitationWithClient(
  params: {
    client: PrismaClient;
    credential: string;
    now?: Date;
  },
) {
  const credential =
    params.credential.trim();

  const now =
    params.now ??
    new Date();

  if (
    !credential ||
    credential.length > 256 ||
    !Number.isFinite(
      now.getTime(),
    )
  ) {
    throw new Error(
      "[FW_INSTITUTIONAL_INVITATION_ACCEPT_INPUT_INVALID]",
    );
  }

  const credentialHash =
    hashFrenchWardInstitutionalInvitationCredential(
      credential,
    );

  return params.client.$transaction(
    async (tx: InvitationAcceptanceTransaction) => {
      /*
       * Serialize all acceptance attempts against this exact invitation.
       * Only the credential hash reaches SQL.
       */
      await tx.$queryRaw`
        SELECT id
        FROM "FrenchWardInstitutionalInvitation"
        WHERE "credentialHash" = ${credentialHash}
        FOR UPDATE
      `;

      const invitation =
        await tx
          .frenchWardInstitutionalInvitation
          .findUnique({
            where: {
              credentialHash,
            },

            select: {
              id: true,
              reference: true,

              recipientEmail: true,
              recipientDisplayName:
                true,

              participantReference:
                true,

              institutionalTitle:
                true,

              secondaryTitle:
                true,

              capacityClass:
                true,

              recognitionBasis:
                true,

              provenanceReference:
                true,

              expiresAt:
                true,

              issuedByUserId:
                true,

              issuedAt:
                true,

              acceptedByUserId:
                true,

              acceptedAt:
                true,

              revokedAt:
                true,
            },
          });

      if (!invitation) {
        throw new Error(
          "[FW_INSTITUTIONAL_INVITATION_CREDENTIAL_INVALID]",
        );
      }

      if (invitation.revokedAt) {
        throw new Error(
          "[FW_INSTITUTIONAL_INVITATION_REVOKED]",
        );
      }

      if (invitation.acceptedAt) {
        throw new Error(
          "[FW_INSTITUTIONAL_INVITATION_ALREADY_ACCEPTED]",
        );
      }

      if (
        invitation.expiresAt <=
        now
      ) {
        throw new Error(
          "[FW_INSTITUTIONAL_INVITATION_EXPIRED]",
        );
      }

      const email =
        normalizeEmail(
          invitation.recipientEmail,
        );

      if (
        email.length < 3 ||
        email.length > 254 ||
        !email.includes("@")
      ) {
        throw new Error(
          "[FW_INSTITUTIONAL_INVITATION_RECIPIENT_EMAIL_INVALID]",
        );
      }

      /*
       * User.email is uniquely constrained but historical casing may differ.
       * Resolve case-insensitively and fail closed if more than one
       * case-variant identity exists.
       */
      const matchingUsers =
        await tx.user.findMany({
          where: {
            email: {
              equals:
                email,

              mode:
                "insensitive",
            },
          },

          orderBy: {
            createdAt:
              "asc",
          },

          take:
            2,

          select: {
            id: true,
            username: true,
            email: true,
            name: true,
            displayName: true,
            isAdmin: true,
            tier: true,
          },
        });

      if (
        matchingUsers.length >
        1
      ) {
        throw new Error(
          "[FW_INSTITUTIONAL_INVITATION_USER_EMAIL_CONTRADICTION]",
        );
      }

      let user =
        matchingUsers[0] ??
        null;

      let userCreated =
        false;

      if (!user) {
        const username =
          institutionalUsername(
            email,
          );

        const usernameOwner =
          await tx.user.findUnique({
            where: {
              username,
            },

            select: {
              id: true,
              email: true,
            },
          });

        if (
          usernameOwner &&
          normalizeEmail(
            usernameOwner.email,
          ) !== email
        ) {
          throw new Error(
            "[FW_INSTITUTIONAL_INVITATION_USERNAME_COLLISION]",
          );
        }

        const passwordHash =
          await createUnusablePasswordHash();

        user =
          await tx.user.create({
            data: {
              username,
              passwordHash,

              email,

              name:
                invitation
                  .recipientDisplayName,

              displayName:
                invitation
                  .recipientDisplayName,

              isAdmin:
                false,

              /*
               * Authentication eligibility is established by the
               * participant record, not inferred from User.tier.
               */
              tier:
                null,

              viewedDocs:
                [],

              metadata: {
                identityClass:
                  "FRENCH_WARD_INSTITUTIONAL_PARTICIPANT",

                source:
                  "french-ward.institutional-invitation",

                loginEnabled:
                  true,
              },
            },

            select: {
              id: true,
              username: true,
              email: true,
              name: true,
              displayName: true,
              isAdmin: true,
              tier: true,
            },
          });

        userCreated =
          true;
      }

      /*
       * Existing AXPT User identity is authoritative and is reused without
       * rewriting name, displayName, tier, admin status or metadata.
       *
       * French-Ward's exact institutional identity belongs to the
       * participant record below.
       */

      const byReference =
        await tx
          .frenchWardInstitutionalParticipant
          .findUnique({
            where: {
              reference:
                invitation
                  .participantReference,
            },

            select: {
              id: true,
              userId: true,
              reference: true,
            },
          });

      const byUser =
        await tx
          .frenchWardInstitutionalParticipant
          .findUnique({
            where: {
              userId:
                user.id,
            },

            select: {
              id: true,
              userId: true,
              reference: true,
            },
          });

      if (
        byReference &&
        byUser &&
        byReference.id !==
          byUser.id
      ) {
        throw new Error(
          "[FW_INSTITUTIONAL_INVITATION_PARTICIPANT_IDENTITY_CONTRADICTION]",
        );
      }

      if (
        byReference ||
        byUser
      ) {
        throw new Error(
          "[FW_INSTITUTIONAL_INVITATION_PARTICIPANT_ALREADY_RECOGNIZED]",
        );
      }

      const participant =
        await tx
          .frenchWardInstitutionalParticipant
          .create({
            data: {
              userId:
                user.id,

              reference:
                invitation
                  .participantReference,

              displayName:
                invitation
                  .recipientDisplayName,

              institutionalTitle:
                invitation
                  .institutionalTitle,

              secondaryTitle:
                invitation
                  .secondaryTitle,

              capacityClass:
                invitation
                  .capacityClass,

              recognitionBasis:
                invitation
                  .recognitionBasis,

              provenanceReference:
                invitation
                  .provenanceReference,

              status:
                "ACTIVE",

              recognizedAt:
                now,

              endedAt:
                null,

              /*
               * Recognition originates from the authority that issued
               * the invitation, not from self-assertion by the recipient.
               */
              createdByUserId:
                invitation
                  .issuedByUserId,
            },

            select: {
              id: true,
              userId: true,
              reference: true,
              displayName: true,
              institutionalTitle:
                true,
              secondaryTitle:
                true,
              capacityClass:
                true,
              recognitionBasis:
                true,
              provenanceReference:
                true,
              status: true,
              recognizedAt:
                true,
              endedAt:
                true,
              createdByUserId:
                true,
            },
          });

      const accepted =
        await tx
          .frenchWardInstitutionalInvitation
          .update({
            where: {
              id:
                invitation.id,
            },

            data: {
              acceptedByUserId:
                user.id,

              acceptedAt:
                now,
            },

            select: {
              id: true,
              reference: true,
              acceptedByUserId:
                true,
              acceptedAt:
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
            "FRENCH_WARD_INSTITUTIONAL_INVITATION_ACCEPTED",

          payload: {
            invitationReference:
              invitation.reference,

            participantId:
              participant.id,

            participantReference:
              participant.reference,

            userId:
              user.id,

            userCreated,

            capacityClass:
              participant.capacityClass,

            institutionalTitle:
              participant.institutionalTitle,

            recognitionBasis:
              participant.recognitionBasis,

            issuedByUserId:
              invitation.issuedByUserId,
          },

          metadata: {
            actorUserId:
              user.id,

            source:
              "french-ward.institutional-invitation.accept",
          },

          occurredAt:
            now,
        },
      });

      return {
        invitation:
          accepted,

        user,

        participant,

        userCreated,
      } as const;
    },
  );
}
