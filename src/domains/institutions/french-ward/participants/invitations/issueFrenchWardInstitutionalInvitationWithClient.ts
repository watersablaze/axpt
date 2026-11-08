import type {
  FrenchWardInstitutionalCapacityClass,
  PrismaClient,
} from "@prisma/client";

import {
  generateFrenchWardInstitutionalInvitationCredential,
  hashFrenchWardInstitutionalInvitationCredential,
} from "./institutionalInvitationCredential";

export type IssueFrenchWardInstitutionalInvitationInput =
  Readonly<{
    reference: string;

    recipientEmail: string;
    recipientDisplayName: string;

    participantReference: string;

    institutionalTitle: string;
    secondaryTitle?: string | null;

    capacityClass:
      FrenchWardInstitutionalCapacityClass;

    recognitionBasis: string;
    provenanceReference?: string | null;

    expiresAt: Date;

    issuedByUserId: string;

    now?: Date;
  }>;

function required(
  value: string,
  field: string,
) {
  const normalized =
    value.trim();

  if (!normalized) {
    throw new Error(
      `[FW_INSTITUTIONAL_INVITATION_${field.toUpperCase()}_REQUIRED]`,
    );
  }

  return normalized;
}

function normalizeEmail(
  value: string,
) {
  return value
    .trim()
    .toLowerCase();
}

/**
 * Issues one controlled French-Ward institutional participation invitation.
 *
 * ISSUED ≠ ACCEPTED ≠ RECOGNIZED ≠ AUTHORIZED.
 *
 * This command:
 * - requires an existing canonical AXPT administrative issuer;
 * - records exact intended institutional participation;
 * - generates a high-entropy bearer credential;
 * - persists only its SHA-256 hash;
 * - records attributable issuance history.
 *
 * It does NOT:
 * - create or alter the recipient User;
 * - create FrenchWardInstitutionalParticipant;
 * - create governing standing;
 * - assign UserRole permissions;
 * - grant commercial or instrument authority;
 * - create institutional resource access;
 * - issue a PIN;
 * - deliver correspondence.
 *
 * The raw credential is returned only from the successful first issuance
 * call. It cannot be reconstructed from durable state.
 */
export async function
issueFrenchWardInstitutionalInvitationWithClient(
  params: {
    client: PrismaClient;

    input:
      IssueFrenchWardInstitutionalInvitationInput;
  },
) {
  const input =
    params.input;

  const reference =
    required(
      input.reference,
      "reference",
    );

  const recipientEmail =
    normalizeEmail(
      input.recipientEmail,
    );

  const recipientDisplayName =
    required(
      input.recipientDisplayName,
      "recipient_display_name",
    );

  const participantReference =
    required(
      input.participantReference,
      "participant_reference",
    );

  const institutionalTitle =
    required(
      input.institutionalTitle,
      "institutional_title",
    );

  const recognitionBasis =
    required(
      input.recognitionBasis,
      "recognition_basis",
    );

  const issuedByUserId =
    required(
      input.issuedByUserId,
      "issued_by_user_id",
    );

  const secondaryTitle =
    input.secondaryTitle?.trim() ||
    null;

  const provenanceReference =
    input.provenanceReference?.trim() ||
    null;

  const expiresAt =
    input.expiresAt;

  const now =
    input.now ??
    new Date();

  if (
    reference.length > 191 ||
    recipientEmail.length < 3 ||
    recipientEmail.length > 254 ||
    !recipientEmail.includes("@") ||
    recipientDisplayName.length > 191 ||
    participantReference.length > 191 ||
    institutionalTitle.length > 191 ||
    issuedByUserId.length > 191 ||
    !Number.isFinite(
      expiresAt.getTime(),
    ) ||
    !Number.isFinite(
      now.getTime(),
    ) ||
    expiresAt <= now
  ) {
    throw new Error(
      "[FW_INSTITUTIONAL_INVITATION_INPUT_INVALID]",
    );
  }

  /*
   * Raw credential is created before persistence but is never supplied
   * to Prisma or DomainEvent payloads.
   */
  const credential =
    generateFrenchWardInstitutionalInvitationCredential();

  const credentialHash =
    hashFrenchWardInstitutionalInvitationCredential(
      credential,
    );

  const result =
    await params.client.$transaction(
      async tx => {
        const issuer =
          await tx.user.findUnique({
            where: {
              id:
                issuedByUserId,
            },

            select: {
              id: true,
              isAdmin: true,
            },
          });

        if (!issuer) {
          throw new Error(
            "[FW_INSTITUTIONAL_INVITATION_ISSUER_NOT_FOUND]",
          );
        }

        /*
         * Initial founding-participant issuance is an administrative
         * function. Do not infer this authority from title, governing
         * standing, institutional participation or commercial authority.
         */
        if (!issuer.isAdmin) {
          throw new Error(
            "[FW_INSTITUTIONAL_INVITATION_ISSUER_NOT_AUTHORIZED]",
          );
        }

        const existingReference =
          await tx
            .frenchWardInstitutionalInvitation
            .findUnique({
              where: {
                reference,
              },

              select: {
                id: true,
              },
            });

        if (existingReference) {
          /*
           * A raw credential cannot be reconstructed safely.
           * Replay therefore fails closed rather than pretending
           * issuance is idempotently recoverable.
           */
          throw new Error(
            "[FW_INSTITUTIONAL_INVITATION_REFERENCE_ALREADY_ISSUED]",
          );
        }

        const activeForParticipant =
          await tx
            .frenchWardInstitutionalInvitation
            .findFirst({
              where: {
                participantReference,

                acceptedAt:
                  null,

                revokedAt:
                  null,

                expiresAt: {
                  gt:
                    now,
                },
              },

              select: {
                id: true,
                reference: true,
              },
            });

        if (activeForParticipant) {
          throw new Error(
            "[FW_INSTITUTIONAL_INVITATION_PENDING_FOR_PARTICIPANT]",
          );
        }

        const invitation =
          await tx
            .frenchWardInstitutionalInvitation
            .create({
              data: {
                reference,

                recipientEmail,
                recipientDisplayName,

                participantReference,

                institutionalTitle,
                secondaryTitle,

                capacityClass:
                  input.capacityClass,

                recognitionBasis,
                provenanceReference,

                credentialHash,
                expiresAt,

                issuedByUserId,
                issuedAt:
                  now,
              },

              select: {
                id: true,
                reference: true,

                recipientEmail: true,
                recipientDisplayName: true,

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

                acceptedAt:
                  true,

                revokedAt:
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
              "FRENCH_WARD_INSTITUTIONAL_INVITATION_ISSUED",

            payload: {
              reference:
                invitation.reference,

              recipientEmail:
                invitation.recipientEmail,

              participantReference:
                invitation.participantReference,

              institutionalTitle:
                invitation.institutionalTitle,

              capacityClass:
                invitation.capacityClass,

              provenanceReference:
                invitation.provenanceReference,

              expiresAt:
                invitation.expiresAt.toISOString(),
            },

            metadata: {
              actorUserId:
                issuedByUserId,

              source:
                "french-ward.institutional-invitation.issue",
            },

            occurredAt:
              now,
          },
        });

        return invitation;
      },
    );

  return {
    invitation:
      result,

    /*
     * Caller must either deliver/use this credential now or discard it.
     * It cannot be recovered from the database.
     */
    credential,
  } as const;
}
