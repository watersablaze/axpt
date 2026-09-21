import {
  REPRESENTATIVE_ONBOARDING_STATUS,
  REPRESENTATIVE_QUALIFICATION_DECISION,
} from "../contracts";

import type { RepresentativeOnboardingPersistenceClient } from "../persistence";

import { transitionRepresentativeOnboardingWithClient } from "./transitionRepresentativeOnboardingWithClient";

export async function declineRepresentativeOnboardingWithClient(params: {
  client: RepresentativeOnboardingPersistenceClient;
  intakeId: string;
  actorUserId: string;
  reason: string;
  occurredAt?: Date;
}) {
  const actorUserId = params.actorUserId.trim();
  const reason = params.reason.trim();

  if (!actorUserId) {
    throw new Error("[ARP_ONBOARDING_DECLINE_ACTOR_REQUIRED]");
  }

  if (!reason) {
    throw new Error("[ARP_ONBOARDING_DECLINE_REASON_REQUIRED]");
  }

  return transitionRepresentativeOnboardingWithClient({
    client: params.client,
    intakeId: params.intakeId,
    toStatus: REPRESENTATIVE_ONBOARDING_STATUS.DECLINED,
    actorUserId,
    reason,
    occurredAt: params.occurredAt,
    data: {
      qualificationDecision: REPRESENTATIVE_QUALIFICATION_DECISION.DECLINED,
    },
  });
}
