export const dossierTransitions = {
  INTAKE_PENDING: [
    'KYC_REVIEW',
  ],

  KYC_REVIEW: [
    'SPA_DRAFTING',
    'BLOCKED',
  ],

  SPA_DRAFTING: [
    'SPA_EXECUTED',
    'CANCELLED',
  ],

  SPA_EXECUTED: [
    'ESCROW_PENDING',
  ],

  ESCROW_PENDING: [
    'ESCROW_FUNDED',
    'BLOCKED',
  ],

  ESCROW_FUNDED: [
    'TREASURY_PENDING',
  ],

  TREASURY_PENDING: [
    'EXPORT_RELEASED',
  ],

  EXPORT_RELEASED: [
    'EXPORT_ACTIVE',
  ],

  EXPORT_ACTIVE: [
    'IN_TRANSIT',
  ],

  IN_TRANSIT: [
    'REFINERY_INTAKE',
  ],

  REFINERY_INTAKE: [
    'REFINERY_ASSAY',
  ],

  REFINERY_ASSAY: [
    'ASSAY_PENDING',
  ],

  ASSAY_PENDING: [
    'SETTLEMENT_PENDING',
  ],

  SETTLEMENT_PENDING: [
    'SETTLED',
  ],

  SETTLED: [
    'CLOSED',
  ],

  BLOCKED: [],
  CANCELLED: [],
  CLOSED: [],
} as const

export type DossierState =
  keyof typeof dossierTransitions

export function getNextDossierStates(
  state: string
): string[] {
  return [
    ...(dossierTransitions[
      state as DossierState
    ] ?? []),
  ]
}

export function canTransitionDossier(
  fromState: string,
  toState: string
): boolean {
  const allowed =
    getNextDossierStates(fromState)

  return allowed.includes(toState)
}