import type {
  PrismaClient,
} from "@prisma/client";

import {
  hashFrenchWardInstitutionalInvitationCredential,
} from "./institutionalInvitationCredential";

import {
  resolveFrenchWardInstitutionalInvitationState,
  type FrenchWardInstitutionalInvitationState,
} from "./institutionalInvitationPolicy";

export type FrenchWardInstitutionalInvitationView =
  Readonly<{
    reference: string;

    recipientDisplayName: string;

    participantReference: string;

    institutionalTitle: string;
    secondaryTitle: string | null;

    capacityClass:
      "STRATEGIC" |
      "OPERATIONS" |
      "FIDUCIARY";

    recognitionBasis: string;
    provenanceReference: string | null;

    expiresAt: Date;
    issuedAt: Date;

    acceptedAt: Date | null;
    revokedAt: Date | null;

    state:
      FrenchWardInstitutionalInvitationState;
  }>;

/**
 * Resolve the current state of one institutional invitation by
 * recipient-held bearer credential.
 *
 * This query:
 * - hashes the credential before persistence access;
 * - returns no credential hash;
 * - performs no mutation;
 * - does not infer participant standing or authority.
 *
 * Missing/invalid credentials project as null so public recipient
 * surfaces need not distinguish credential existence.
 */
export async function
loadFrenchWardInstitutionalInvitationStateWithClient(
  params: {
    client:
      Pick<
        PrismaClient,
        "frenchWardInstitutionalInvitation"
      >;

    credential: string;

    now?: Date;
  },
): Promise<
  FrenchWardInstitutionalInvitationView | null
> {
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
    return null;
  }

  const credentialHash =
    hashFrenchWardInstitutionalInvitationCredential(
      credential,
    );

  const invitation =
    await params.client
      .frenchWardInstitutionalInvitation
      .findUnique({
        where: {
          credentialHash,
        },

        select: {
          reference:
            true,

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

          issuedAt:
            true,

          acceptedAt:
            true,

          revokedAt:
            true,
        },
      });

  if (!invitation) {
    return null;
  }

  return {
    reference:
      invitation.reference,

    recipientDisplayName:
      invitation.recipientDisplayName,

    participantReference:
      invitation.participantReference,

    institutionalTitle:
      invitation.institutionalTitle,

    secondaryTitle:
      invitation.secondaryTitle,

    capacityClass:
      invitation.capacityClass,

    recognitionBasis:
      invitation.recognitionBasis,

    provenanceReference:
      invitation.provenanceReference,

    expiresAt:
      invitation.expiresAt,

    issuedAt:
      invitation.issuedAt,

    acceptedAt:
      invitation.acceptedAt,

    revokedAt:
      invitation.revokedAt,

    state:
      resolveFrenchWardInstitutionalInvitationState(
        {
          expiresAt:
            invitation.expiresAt,

          acceptedAt:
            invitation.acceptedAt,

          revokedAt:
            invitation.revokedAt,
        },

        now,
      ),
  };
}
