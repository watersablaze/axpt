type DossierInstrumentForGate = {
  type: string
  status: string
}

export type ArtifactGateCheck = {
  id: string
  label: string
  passed: boolean
  detail?: string
}

export type ArtifactGateResult = {
  passed: boolean
  blockingReason?: string
  checks: ArtifactGateCheck[]
}

type ArtifactGateInput = {
  fromState: string
  toState: string
  instruments?: DossierInstrumentForGate[]
}

function hasActiveInstrument(
  instruments: DossierInstrumentForGate[],
  type: string
) {
  return instruments.some(
    (instrument) =>
      instrument.type === type &&
      ['ACTIVE', 'EXECUTED'].includes(instrument.status)
  )
}

export function checkDossierArtifactGate({
  fromState,
  toState,
  instruments = [],
}: ArtifactGateInput): ArtifactGateResult {
  if (
    fromState === 'TREASURY_PENDING' &&
    toState === 'EXPORT_RELEASED'
  ) {
    const checks: ArtifactGateCheck[] = [
      {
        id: 'compliance-package',
        label: 'Compliance package active',
        passed: hasActiveInstrument(
          instruments,
          'ANNEX_D_COMPLIANCE'
        ),
        detail: 'Annex D must be active or executed.',
      },
      {
        id: 'refinery-coordination',
        label: 'Refinery coordination active',
        passed: hasActiveInstrument(
          instruments,
          'ANNEX_C_REFINERY'
        ),
        detail: 'Annex C must be active or executed.',
      },
      {
        id: 'procedure-sheet',
        label: 'Procedure sheet active',
        passed: hasActiveInstrument(
          instruments,
          'ANNEX_E_PROCEDURE'
        ),
        detail: 'Annex E must be active or executed.',
      },
    ]

    const failed = checks.filter((check) => !check.passed)

    return {
      passed: failed.length === 0,
      blockingReason:
        failed.length > 0
          ? 'Export release requires active compliance, refinery coordination, and procedure instruments.'
          : undefined,
      checks,
    }
  }

  if (
    fromState === 'REFINERY_ASSAY' &&
    toState === 'SETTLEMENT_PENDING'
  ) {
    const checks: ArtifactGateCheck[] = [
      {
        id: 'assay-confirmation',
        label: 'Assay confirmation finalized',
        passed: false,
        detail:
          'Final assay confirmation must be attached before settlement preparation.',
      },
      {
        id: 'treasury-reconciliation',
        label: 'Treasury reconciliation complete',
        passed: false,
        detail:
          'Treasury reconciliation must be completed before settlement preparation.',
      },
    ]

    return {
      passed: false,
      blockingReason:
        'Settlement preparation requires finalized assay confirmation and treasury reconciliation.',
      checks,
    }
  }

  return {
    passed: true,
    checks: [
      {
        id: 'baseline',
        label: 'No active artifact gate',
        passed: true,
        detail:
          'Current transition has no blocking artifact requirements.',
      },
    ],
  }
}