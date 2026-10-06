export type RepresentativeOnboardingContinuityProfile =
  | {
      kind: "STANDARD";
    }
  | {
      kind: "EXISTING_EXECUTED_MASTER_AGREEMENT";
      existingEngagement: true;
      previouslyExecutedMasterAgreement: true;
      digitalReconciliationPending: true;
      workspacePreparing: true;
    };

const JENS_THOMSEN_REFERENCE =
  "FWI-26-RP-ONB-CFCC47E131";

export function getRepresentativeOnboardingContinuityProfile(
  reference: string,
): RepresentativeOnboardingContinuityProfile {
  if (reference === JENS_THOMSEN_REFERENCE) {
    return {
      kind: "EXISTING_EXECUTED_MASTER_AGREEMENT",
      existingEngagement: true,
      previouslyExecutedMasterAgreement: true,
      digitalReconciliationPending: true,
      workspacePreparing: true,
    };
  }

  return {
    kind: "STANDARD",
  };
}
