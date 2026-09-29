/**
 * French-Ward Authorized Representation Program
 * Candidate / onboarding vocabulary.
 *
 * This surface intentionally precedes persistence.
 *
 * CANDIDATE ≠ PARTICIPANT
 * INTAKE ≠ ADMISSION
 * SUBMISSION ≠ APPROVAL
 * APPROVAL ≠ APPOINTMENT
 */

export const REPRESENTATIVE_ONBOARDING_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  QUALIFIED: "QUALIFIED",
  RETURNED_FOR_COMPLETION: "RETURNED_FOR_COMPLETION",
  DECLINED: "DECLINED",
  ADMITTED: "ADMITTED",
} as const;

export type RepresentativeOnboardingStatus =
  (typeof REPRESENTATIVE_ONBOARDING_STATUS)[keyof typeof REPRESENTATIVE_ONBOARDING_STATUS];

export const REPRESENTATIVE_ONBOARDING_TERMINAL_STATUS = [
  REPRESENTATIVE_ONBOARDING_STATUS.DECLINED,
  REPRESENTATIVE_ONBOARDING_STATUS.ADMITTED,
] as const;

/**
 * Information supplied by a representative candidate.
 *
 * V1 deliberately separates candidate facts from French-Ward
 * qualification and appointment decisions.
 */
export type RepresentativeCandidateIdentity = Readonly<{
  fullLegalName: string;
  preferredProfessionalName?: string;
  nationality?: string;
  countryOfResidence?: string;
  primaryAddress?: string;
  email: string;
  telephone?: string;
  whatsapp?: string;
  passportOrIdReference?: string;
}>;

export type RepresentativeCandidateProfessionalProfile = Readonly<{
  currentOccupationOrRole?: string;
  companyOrOrganizationAffiliations?: readonly string[];
  relevantMarketsOrIndustries?: readonly string[];
  primaryTerritories?: readonly string[];
  languages?: readonly string[];
  commercialCapabilities?: readonly string[];
}>;

export type RepresentativeCandidateRepresentationContext = Readonly<{
  introductionContext?: string;
  expectedContribution?: string;
  relevantRelationshipsOrNetworks?: string;
  anticipatedRepresentationAreas?: readonly string[];
}>;

export type RepresentativeCandidateDisclosures = Readonly<{
  existingMandatesOrRepresentativeRelationships?: string;
  potentialConflicts?: string;
  regulatedActivities?: string;
  materialAffiliations?: string;
}>;

/**
 * Candidate acknowledgements are explicit factual assertions.
 * They do not themselves create Program authority.
 */
export type RepresentativeCandidateAcknowledgements = Readonly<{
  noImpliedAuthority: boolean;
  noUnauthorizedCommercialTermChanges: boolean;
  noImpersonationOfFrenchWard: boolean;
  noUnauthorizedSubdelegation: boolean;
  confidentialityAcknowledged: boolean;
  writtenAppointmentControlsAuthority: boolean;
  informationAccurateToBestKnowledge: boolean;
}>;

export type RepresentativeOnboardingSubmission = Readonly<{
  identity: RepresentativeCandidateIdentity;
  professionalProfile: RepresentativeCandidateProfessionalProfile;
  representationContext: RepresentativeCandidateRepresentationContext;
  disclosures: RepresentativeCandidateDisclosures;
  acknowledgements: RepresentativeCandidateAcknowledgements;
}>;

/**
 * Internal qualification is a French-Ward review object.
 *
 * It must never be inferred from candidate submission.
 */
export const REPRESENTATIVE_QUALIFICATION_DECISION = {
  PENDING: "PENDING",
  QUALIFIED: "QUALIFIED",
  RETURN_FOR_COMPLETION: "RETURN_FOR_COMPLETION",
  DECLINED: "DECLINED",
} as const;

export type RepresentativeQualificationDecision =
  (typeof REPRESENTATIVE_QUALIFICATION_DECISION)[keyof typeof REPRESENTATIVE_QUALIFICATION_DECISION];

export type RepresentativeQualificationReview = Readonly<{
  decision: RepresentativeQualificationDecision;
  reviewedByUserId?: string;
  reviewedAt?: Date;
  internalNotes?: string;
}>;

export function isRepresentativeOnboardingTerminal(
  status: RepresentativeOnboardingStatus,
): boolean {
  return (
    status === REPRESENTATIVE_ONBOARDING_STATUS.DECLINED ||
    status === REPRESENTATIVE_ONBOARDING_STATUS.ADMITTED
  );
}

export function assertRepresentativeOnboardingStatusTransition(params: {
  from: RepresentativeOnboardingStatus;
  to: RepresentativeOnboardingStatus;
}): void {
  if (params.from === params.to) {
    throw new Error(`[ARP_ONBOARDING_STATUS_NOOP] status=${params.from}`);
  }

  const allowed =
    (params.from === REPRESENTATIVE_ONBOARDING_STATUS.DRAFT &&
      params.to === REPRESENTATIVE_ONBOARDING_STATUS.SUBMITTED) ||
    (params.from === REPRESENTATIVE_ONBOARDING_STATUS.SUBMITTED &&
      params.to === REPRESENTATIVE_ONBOARDING_STATUS.UNDER_REVIEW) ||
    (params.from === REPRESENTATIVE_ONBOARDING_STATUS.UNDER_REVIEW &&
      (params.to === REPRESENTATIVE_ONBOARDING_STATUS.QUALIFIED ||
        params.to ===
          REPRESENTATIVE_ONBOARDING_STATUS.RETURNED_FOR_COMPLETION ||
        params.to === REPRESENTATIVE_ONBOARDING_STATUS.DECLINED)) ||
    (params.from === REPRESENTATIVE_ONBOARDING_STATUS.RETURNED_FOR_COMPLETION &&
      params.to === REPRESENTATIVE_ONBOARDING_STATUS.SUBMITTED) ||
    (params.from === REPRESENTATIVE_ONBOARDING_STATUS.QUALIFIED &&
      params.to === REPRESENTATIVE_ONBOARDING_STATUS.ADMITTED);

  if (!allowed) {
    throw new Error(
      `[ARP_ONBOARDING_STATUS_TRANSITION_INVALID] from=${params.from} to=${params.to}`,
    );
  }
}
