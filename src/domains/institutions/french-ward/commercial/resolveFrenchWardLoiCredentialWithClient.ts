import type {
  PrismaClient,
} from "@prisma/client";

import {
  resolveInstitutionalAccessWithClient,
} from "@/domains/institutional-access/resolveInstitutionalAccessWithClient";

import {
  FRENCH_WARD_COMMERCIAL_INTAKE,
} from "./canonicalCommercialIntake";

import {
  FRENCH_WARD_GOVERNING_LOI_POLICY,
} from "./createFrenchWardLoiInvitationWithClient";

import {
  hashFrenchWardLoiCredential,
} from "./loiInvitationCredential";

type CredentialClient = Pick<
  PrismaClient,
  | "frenchWardLoiInvitation"
  | "institutionalAccessGrant"
>;

export async function resolveFrenchWardLoiCredentialWithClient(
  input: {
    client: CredentialClient;
    credential: string;
    action:
      | "VIEW_FORM"
      | "SUBMIT_INTAKE";
    now?: Date;
  },
) {
  const credential =
    input.credential.trim();

  const now =
    input.now ?? new Date();

  if (
    !credential ||
    credential.length > 256 ||
    !Number.isFinite(
      now.getTime(),
    )
  ) {
    return {
      allowed:
        false,
      reason:
        "ACCESS_DENIED",
    } as const;
  }

  const invitation =
    await input.client
      .frenchWardLoiInvitation
      .findUnique({
        where: {
          credentialHash:
            hashFrenchWardLoiCredential(
              credential,
            ),
        },

        select: {
          id:
            true,

          grantId:
            true,

          recipientUserId:
            true,

          recipientEmail:
            true,

          recipientName:
            true,

          policy:
            true,

          expiresAt:
            true,

          revokedAt:
            true,

          credentialIssuedAt:
            true,
        },
      });

  if (
    !invitation ||
    !invitation
      .credentialIssuedAt ||
    invitation.revokedAt ||
    invitation.expiresAt <= now ||
    invitation.policy !==
      FRENCH_WARD_GOVERNING_LOI_POLICY
  ) {
    return {
      allowed:
        false,
      reason:
        "ACCESS_DENIED",
    } as const;
  }

  const access =
    await resolveInstitutionalAccessWithClient({
      client:
        input.client,

      identity: {
        userId:
          invitation
            .recipientUserId,

        email:
          invitation
            .recipientEmail,
      },

      scope:
        FRENCH_WARD_COMMERCIAL_INTAKE
          .accessScope,

      action:
        input.action,

      resourceReference:
        FRENCH_WARD_COMMERCIAL_INTAKE
          .reference,

      resourceVersion:
        FRENCH_WARD_COMMERCIAL_INTAKE
          .version,

      grantId:
        invitation.grantId,

      now,
    });

  if (!access.allowed) {
    return access;
  }

  return {
    allowed:
      true,

    invitationId:
      invitation.id,

    grantId:
      invitation.grantId,

    identity: {
      userId:
        invitation
          .recipientUserId,

      email:
        invitation
          .recipientEmail,
    },

    recipientName:
      invitation
        .recipientName,

    expiresAt:
      invitation
        .expiresAt,

    access:
      access.grant,
  } as const;
}
