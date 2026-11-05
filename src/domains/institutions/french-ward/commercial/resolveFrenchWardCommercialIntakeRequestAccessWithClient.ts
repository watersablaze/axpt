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
  resolveFrenchWardLoiCredentialWithClient,
} from "./resolveFrenchWardLoiCredentialWithClient";

type PrincipalIdentity = {
  userId: string;
  email: string;
  displayName?: string | null;
};

type RequestAccessClient =
  PrismaClient;

export async function resolveFrenchWardCommercialIntakeRequestAccessWithClient(
  input: {
    client: RequestAccessClient;

    principal?:
      | PrincipalIdentity
      | null;

    credential?:
      | string
      | null;

    action:
      | "VIEW_FORM"
      | "SUBMIT_INTAKE";

    now?: Date;
  },
) {
  const now =
    input.now ?? new Date();

  /*
   * An authenticated principal remains the first continuity path.
   *
   * A principal that does not itself hold the relevant Institutional
   * Access does not invalidate an independently valid recipient
   * invitation present in the scoped HttpOnly cookie.
   */
  if (
    input.principal?.userId &&
    input.principal.email
  ) {
    const principalAccess =
      await resolveInstitutionalAccessWithClient({
        client:
          input.client,

        identity: {
          userId:
            input.principal.userId,

          email:
            input.principal.email,
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

        now,
      });

    if (principalAccess.allowed) {
      return {
        allowed:
          true,

        source:
          "AUTHENTICATED_PRINCIPAL" as const,

        identity: {
          userId:
            input.principal.userId,

          email:
            input.principal.email,
        },

        grantId:
          principalAccess.grant.id,

        displayName:
          input.principal.displayName ??
          "",

        email:
          input.principal.email,

        access:
          principalAccess.grant,
      } as const;
    }
  }

  const credential =
    input.credential?.trim() ??
    "";

  if (!credential) {
    return {
      allowed:
        false,

      reason:
        "ACCESS_DENIED",
    } as const;
  }

  const invitationAccess =
    await resolveFrenchWardLoiCredentialWithClient({
      client:
        input.client,

      credential,

      action:
        input.action,

      now,
    });

  if (!invitationAccess.allowed) {
    return invitationAccess;
  }

  return {
    allowed:
      true,

    source:
      "GOVERNING_LOI_CREDENTIAL" as const,

    identity:
      invitationAccess.identity,

    grantId:
      invitationAccess.grantId,

    displayName:
      invitationAccess.recipientName,

    email:
      invitationAccess.identity.email,

    invitationId:
      invitationAccess.invitationId,

    expiresAt:
      invitationAccess.expiresAt,

    access:
      invitationAccess.access,
  } as const;
}
