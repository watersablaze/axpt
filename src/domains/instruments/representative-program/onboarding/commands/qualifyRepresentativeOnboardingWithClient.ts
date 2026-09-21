import {
  REPRESENTATIVE_ONBOARDING_STATUS,
  REPRESENTATIVE_QUALIFICATION_DECISION,
} from "../contracts";

import type { RepresentativeOnboardingPersistenceClient } from "../persistence";

import { transitionRepresentativeOnboardingWithClient } from "./transitionRepresentativeOnboardingWithClient";

export async function qualifyRepresentativeOnboardingWithClient(params: {
  client: RepresentativeOnboardingPersistenceClient;
  intakeId: string;
  actorUserId: string;
  internalNotes?: string | null;
  occurredAt?: Date;
}) {
  const actorUserId = params.actorUserId.trim();

  if (!actorUserId) {
    throw new Error("[ARP_ONBOARDING_QUALIFICATION_ACTOR_REQUIRED]");
  }

  const occurredAt = params.occurredAt ?? new Date();

  return transitionRepresentativeOnboardingWithClient({
    client: params.client,
    intakeId: params.intakeId,
    toStatus: REPRESENTATIVE_ONBOARDING_STATUS.QUALIFIED,
    actorUserId,
    reason: "Representative candidate qualified for Program admission",
    occurredAt,
    data: {
      qualificationDecision: REPRESENTATIVE_QUALIFICATION_DECISION.QUALIFIED,
      qualifiedAt: occurredAt,
      ...(params.internalNotes !== undefined
        ? {
            internalNotes: params.internalNotes?.trim() || null,
          }
        : {}),
    },
  });
}
