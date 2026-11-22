import type { PrismaClient } from "@prisma/client";

import {
  FRENCH_WARD_COMMERCIAL_INTAKE,
} from "../institutions/french-ward/commercial";

import type {
  Principal,
} from "../auth/types";

import {
  decideInstitutionalAccessWithClient,
} from "./manageInstitutionalAccessWithClient";

import {
  revokeInstitutionalAccessWithClient,
} from "./consumeInstitutionalAccessWithClient";

export const COMMERCIAL_INTAKE_RECIPIENT_SIGN_IN_URL =
  "/login?next=%2Ffrench-ward%2Ftransaction-intake";

export async function decideCommercialIntakeAccessWithClient(
  params: {
    client: PrismaClient;
    actor: Principal;
    requestId: string;
    decision: "APPROVED" | "DECLINED";
    reason: string;
    expiresAt?: Date;
  },
) {
  const result =
    await decideInstitutionalAccessWithClient({
      ...params,

      provisionRecipient:
        true,

      expectedResource: {
        scope:
          FRENCH_WARD_COMMERCIAL_INTAKE.accessScope,

        resourceReference:
          FRENCH_WARD_COMMERCIAL_INTAKE.reference,

        resourceVersion:
          FRENCH_WARD_COMMERCIAL_INTAKE.version,
      },
    });

  return {
    ...result,

    recipientSignInUrl:
      result.status === "APPROVED"
        ? COMMERCIAL_INTAKE_RECIPIENT_SIGN_IN_URL
        : null,

    notificationSent:
      false,
  };
}

export async function revokeCommercialIntakeAccessWithClient(
  params: {
    client: PrismaClient;
    actor: Principal;
    grantId: string;
    reason: string;
  },
) {
  return revokeInstitutionalAccessWithClient({
    ...params,

    expectedScope:
      FRENCH_WARD_COMMERCIAL_INTAKE.accessScope,
  });
}
