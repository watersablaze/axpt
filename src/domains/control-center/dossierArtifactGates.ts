export type ArtifactGateResult = {
  passed: boolean
  blockingReason?: string
}

type ArtifactGateInput = {
  fromState: string
  toState: string
}

export function checkDossierArtifactGate({
  fromState,
  toState,
}: ArtifactGateInput): ArtifactGateResult {

  /*
  ─────────────────────────────
  EXPORT ACTIVATION GATE
  ─────────────────────────────
  */

  if (
    fromState === 'TREASURY_PENDING' &&
    toState === 'EXPORT_RELEASED'
  ) {
    return {
      passed: false,
      blockingReason:
        'Export release requires refinery coordination documents, escrow confirmation, and compliance verification.',
    }
  }

  /*
  ─────────────────────────────
  SETTLEMENT GATE
  ─────────────────────────────
  */

  if (
    fromState === 'REFINERY_ASSAY' &&
    toState === 'SETTLEMENT_PENDING'
  ) {
    return {
      passed: false,
      blockingReason:
        'Settlement preparation requires finalized assay confirmation and treasury reconciliation.',
    }
  }

  return {
    passed: true,
  }
}