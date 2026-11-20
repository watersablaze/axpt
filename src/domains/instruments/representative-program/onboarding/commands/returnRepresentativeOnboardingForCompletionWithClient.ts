import {
  REPRESENTATIVE_ONBOARDING_STATUS,
  REPRESENTATIVE_QUALIFICATION_DECISION,
} from "../contracts";

import type { RepresentativeOnboardingPersistenceClient } from "../persistence";

import { transitionRepresentativeOnboardingWithClient } from "./transitionRepresentativeOnboardingWithClient";

export async function returnRepresentativeOnboardingForCompletionWithClient(params: {
  client: RepresentativeOnboardingPersistenceClient;
  intakeId: string;
  actorUserId: string;
  reason: string;
  occurredAt?: Date;
}) {
  const actorUserId = params.actorUserId.trim();
  const reason = params.reason.trim();

  if (!actorUserId) {
    throw new Error("[ARP_ONBOARDING_RETURN_ACTOR_REQUIRED]");
  }

  if (!reason) {
    throw new Error("[ARP_ONBOARDING_RETURN_REASON_REQUIRED]");
  }

  return transitionRepresentativeOnboardingWithClient({
    client: params.client,
    intakeId: params.intakeId,
    toStatus: REPRESENTATIVE_ONBOARDING_STATUS.RETURNED_FOR_COMPLETION,
    actorUserId,
    reason,
    occurredAt: params.occurredAt,
    data: {
      qualificationDecision:
        REPRESENTATIVE_QUALIFICATION_DECISION.RETURN_FOR_COMPLETION,
    },
  });
}
