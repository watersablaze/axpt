import type { PrismaClient } from "@prisma/client";
import type { Principal } from "../auth/types";
import { projectFrenchWardInstitutionalProfile } from "../institutions/french-ward/projectFrenchWardInstitutionalProfile";
import { decideInstitutionalAccessWithClient } from "./manageInstitutionalAccessWithClient";
import { revokeInstitutionalAccessWithClient } from "./consumeInstitutionalAccessWithClient";

export const PROFILE_RECIPIENT_SIGN_IN_URL =
  "/login?next=%2Ffrench-ward%2Fprofile";

export async function decideProfileAccessWithClient(params: {
  client: PrismaClient;
  actor: Principal;
  requestId: string;
  decision: "APPROVED" | "DECLINED";
  reason: string;
  expiresAt?: Date;
}) {
  const profile = projectFrenchWardInstitutionalProfile();
  const result = await decideInstitutionalAccessWithClient({
    ...params,
    provisionRecipient: true,
    expectedResource: {
      scope: "PROFILE_VIEW",
      resourceReference: profile.reference,
      resourceVersion: profile.version,
    },
  });
  return {
    ...result,
    recipientSignInUrl:
      result.status === "APPROVED" ? PROFILE_RECIPIENT_SIGN_IN_URL : null,
    notificationSent: false,
  };
}

export async function revokeProfileAccessWithClient(params: {
  client: PrismaClient;
  actor: Principal;
  grantId: string;
  reason: string;
}) {
  return revokeInstitutionalAccessWithClient({
    ...params,
    expectedScope: "PROFILE_VIEW",
  });
}
