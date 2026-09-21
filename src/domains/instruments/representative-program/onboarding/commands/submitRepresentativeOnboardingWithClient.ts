import {
  REPRESENTATIVE_ONBOARDING_STATUS,
  REPRESENTATIVE_QUALIFICATION_DECISION,
  type RepresentativeOnboardingSubmission,
} from "../contracts";

import type { RepresentativeOnboardingPersistenceClient } from "../persistence";

import { transitionRepresentativeOnboardingWithClient } from "./transitionRepresentativeOnboardingWithClient";

export async function submitRepresentativeOnboardingWithClient(params: {
  client: RepresentativeOnboardingPersistenceClient;
  intakeId: string;
  submission: RepresentativeOnboardingSubmission;
  occurredAt?: Date;
}) {
  const legalName = params.submission.identity.fullLegalName.trim();
  const email = params.submission.identity.email.trim().toLowerCase();

  if (!legalName) {
    throw new Error("[ARP_ONBOARDING_SUBMISSION_LEGAL_NAME_REQUIRED]");
  }

  if (!email) {
    throw new Error("[ARP_ONBOARDING_SUBMISSION_EMAIL_REQUIRED]");
  }

  const acknowledgements = params.submission.acknowledgements;

  if (
    acknowledgements.noImpliedAuthority !== true ||
    acknowledgements.noUnauthorizedCommercialTermChanges !== true ||
    acknowledgements.noImpersonationOfFrenchWard !== true ||
    acknowledgements.noUnauthorizedSubdelegation !== true ||
    acknowledgements.confidentialityAcknowledged !== true ||
    acknowledgements.writtenAppointmentControlsAuthority !== true ||
    acknowledgements.informationAccurateToBestKnowledge !== true
  ) {
    throw new Error("[ARP_ONBOARDING_REQUIRED_ACKNOWLEDGEMENTS_INCOMPLETE]");
  }

  const occurredAt = params.occurredAt ?? new Date();

  return transitionRepresentativeOnboardingWithClient({
    client: params.client,
    intakeId: params.intakeId,
    toStatus: REPRESENTATIVE_ONBOARDING_STATUS.SUBMITTED,
    actorUserId: null,
    reason: "Representative candidate submitted onboarding intake",
    occurredAt,
    data: {
      candidateDisplayName: legalName,
      candidateEmail: email,
      submission: params.submission,
      qualificationDecision: REPRESENTATIVE_QUALIFICATION_DECISION.PENDING,
      submittedAt: occurredAt,
      reviewStartedAt: null,
      qualifiedAt: null,
    },
  });
}
