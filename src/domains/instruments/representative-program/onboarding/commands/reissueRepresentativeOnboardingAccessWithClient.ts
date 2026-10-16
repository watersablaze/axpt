import { REPRESENTATIVE_ONBOARDING_STATUS } from "../contracts";

import {
  generateRepresentativeOnboardingAccessToken,
  hashRepresentativeOnboardingAccessToken,
} from "../accessToken";

import type { RepresentativeOnboardingPersistenceClient } from "../persistence";

export async function reissueRepresentativeOnboardingAccessWithClient(params: {
  client: RepresentativeOnboardingPersistenceClient;
  intakeId: string;
  accessExpiresAt: Date;
  issuedAt?: Date;
}) {
  const intakeId = params.intakeId.trim();

  if (!intakeId) {
    throw new Error("[ARP_ONBOARDING_INTAKE_ID_REQUIRED]");
  }

  const issuedAt = params.issuedAt ?? new Date();

  if (
    !Number.isFinite(issuedAt.getTime()) ||
    !Number.isFinite(params.accessExpiresAt.getTime())
  ) {
    throw new Error("[ARP_ONBOARDING_ACCESS_TIME_INVALID]");
  }

  if (params.accessExpiresAt.getTime() <= issuedAt.getTime()) {
    throw new Error("[ARP_ONBOARDING_ACCESS_EXPIRY_INVALID]");
  }

  const existing =
    await params.client.representativeOnboardingIntake.findUnique({
      where: {
        id: intakeId,
      },
    });

  if (!existing) {
    throw new Error("[ARP_ONBOARDING_INTAKE_NOT_FOUND]");
  }

  if (
    existing.status !== REPRESENTATIVE_ONBOARDING_STATUS.DRAFT &&
    existing.status !== REPRESENTATIVE_ONBOARDING_STATUS.RETURNED_FOR_COMPLETION
  ) {
    throw new Error(
      `[ARP_ONBOARDING_ACCESS_REISSUE_STATUS_INVALID:${existing.status}]`,
    );
  }

  const rawAccessToken = generateRepresentativeOnboardingAccessToken();

  const accessTokenHash =
    hashRepresentativeOnboardingAccessToken(rawAccessToken);

  const intake = await params.client.representativeOnboardingIntake.update({
    where: {
      id: intakeId,
    },
    data: {
      accessTokenHash,
      accessIssuedAt: issuedAt,
      accessExpiresAt: params.accessExpiresAt,
      accessRevokedAt: null,
    },
  });

  return {
    intake,
    rawAccessToken,
  } as const;
}
