import { hashRepresentativeOnboardingAccessToken } from "../accessToken";

import type { RepresentativeOnboardingPersistenceClient } from "../persistence";

export const REPRESENTATIVE_ONBOARDING_ACCESS_REASON = {
  ACCESSIBLE: "ACCESSIBLE",
  NOT_FOUND: "NOT_FOUND",
  NOT_ISSUED: "NOT_ISSUED",
  REVOKED: "REVOKED",
  EXPIRED: "EXPIRED",
} as const;

export async function resolveRepresentativeOnboardingAccessWithClient(params: {
  client: RepresentativeOnboardingPersistenceClient;
  rawAccessToken: string;
  at?: Date;
}) {
  const at = params.at ?? new Date();

  if (!Number.isFinite(at.getTime())) {
    throw new Error("[ARP_ONBOARDING_ACCESS_REFERENCE_TIME_INVALID]");
  }

  const accessTokenHash = hashRepresentativeOnboardingAccessToken(
    params.rawAccessToken,
  );

  const intake = await params.client.representativeOnboardingIntake.findUnique({
    where: {
      accessTokenHash,
    },
  });

  if (!intake) {
    return {
      accessible: false,
      reason: REPRESENTATIVE_ONBOARDING_ACCESS_REASON.NOT_FOUND,
      intake: null,
      evaluatedAt: at,
    } as const;
  }

  if (!intake.accessIssuedAt) {
    return {
      accessible: false,
      reason: REPRESENTATIVE_ONBOARDING_ACCESS_REASON.NOT_ISSUED,
      intake,
      evaluatedAt: at,
    } as const;
  }

  if (intake.accessRevokedAt) {
    return {
      accessible: false,
      reason: REPRESENTATIVE_ONBOARDING_ACCESS_REASON.REVOKED,
      intake,
      evaluatedAt: at,
    } as const;
  }

  if (
    intake.accessExpiresAt &&
    at.getTime() >= intake.accessExpiresAt.getTime()
  ) {
    return {
      accessible: false,
      reason: REPRESENTATIVE_ONBOARDING_ACCESS_REASON.EXPIRED,
      intake,
      evaluatedAt: at,
    } as const;
  }

  return {
    accessible: true,
    reason: REPRESENTATIVE_ONBOARDING_ACCESS_REASON.ACCESSIBLE,
    intake,
    evaluatedAt: at,
  } as const;
}
