import { REPRESENTATIVE_ONBOARDING_STATUS } from "../contracts";

import type { RepresentativeOnboardingPersistenceClient } from "../persistence";

import { transitionRepresentativeOnboardingWithClient } from "./transitionRepresentativeOnboardingWithClient";

export async function beginRepresentativeOnboardingReviewWithClient(params: {
  client: RepresentativeOnboardingPersistenceClient;
  intakeId: string;
  actorUserId: string;
  occurredAt?: Date;
}) {
  const actorUserId = params.actorUserId.trim();

  if (!actorUserId) {
    throw new Error("[ARP_ONBOARDING_REVIEW_ACTOR_REQUIRED]");
  }

  const occurredAt = params.occurredAt ?? new Date();

  return transitionRepresentativeOnboardingWithClient({
    client: params.client,
    intakeId: params.intakeId,
    toStatus: REPRESENTATIVE_ONBOARDING_STATUS.UNDER_REVIEW,
    actorUserId,
    reason: "French-Ward representative qualification review opened",
    occurredAt,
    data: {
      reviewStartedAt: occurredAt,
    },
  });
}
