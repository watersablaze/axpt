import {
  REPRESENTATIVE_ONBOARDING_STATUS,
  REPRESENTATIVE_QUALIFICATION_DECISION,
} from "../contracts";

import {
  createRepresentativeOnboardingReference,
  generateRepresentativeOnboardingAccessToken,
  hashRepresentativeOnboardingAccessToken,
} from "../accessToken";

import type { RepresentativeOnboardingPersistenceClient } from "../persistence";

export async function createRepresentativeOnboardingInvitationWithClient(params: {
  client: RepresentativeOnboardingPersistenceClient;
  candidateDisplayName: string;
  candidateEmail: string;
  createdByUserId: string;
  accessExpiresAt: Date;
  issuedAt?: Date;
  reference?: string;
}) {
  const displayName = params.candidateDisplayName.trim();
  const email = params.candidateEmail.trim().toLowerCase();
  const createdByUserId = params.createdByUserId.trim();

  if (!displayName) {
    throw new Error("[ARP_ONBOARDING_CANDIDATE_NAME_REQUIRED]");
  }

  if (!email) {
    throw new Error("[ARP_ONBOARDING_CANDIDATE_EMAIL_REQUIRED]");
  }

  if (!createdByUserId) {
    throw new Error("[ARP_ONBOARDING_CREATOR_REQUIRED]");
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

  const rawAccessToken = generateRepresentativeOnboardingAccessToken();

  const accessTokenHash =
    hashRepresentativeOnboardingAccessToken(rawAccessToken);

  const reference =
    params.reference?.trim() ||
    createRepresentativeOnboardingReference({
      at: issuedAt,
    });

  const intake = await params.client.representativeOnboardingIntake.create({
    data: {
      reference,
      status: REPRESENTATIVE_ONBOARDING_STATUS.DRAFT,
      qualificationDecision: REPRESENTATIVE_QUALIFICATION_DECISION.PENDING,

      candidateDisplayName: displayName,
      candidateEmail: email,

      accessTokenHash,
      accessIssuedAt: issuedAt,
      accessExpiresAt: params.accessExpiresAt,
      createdByUserId,

      transitions: {
        create: {
          fromStatus: null,
          toStatus: REPRESENTATIVE_ONBOARDING_STATUS.DRAFT,
          actorUserId: createdByUserId,
          reason: "Representative onboarding invitation created",
          occurredAt: issuedAt,
        },
      },
    },
  });

  return {
    intake,

    /**
     * The raw token is returned exactly at issuance time.
     * It is never persisted by this command.
     */
    rawAccessToken,
  } as const;
}
