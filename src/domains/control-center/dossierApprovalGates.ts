export type ApprovalGateCheck = {
  id: string
  label: string
  passed: boolean
  detail?: string
}

export type ApprovalGateResult = {
  passed: boolean
  blockingReason?: string
  checks: ApprovalGateCheck[]
}

type ApprovalGateInput = {
  fromState: string
  toState: string
  operatorRoles?: string[]
}

export function checkDossierApprovalGate({
  fromState,
  toState,
  operatorRoles = [],
}: ApprovalGateInput): ApprovalGateResult {
  if (
    fromState === 'TREASURY_PENDING' &&
    toState === 'EXPORT_RELEASED'
  ) {
    const hasAuthority =
      operatorRoles.includes('ADMIN_PLATFORM')

    return {
      passed: hasAuthority,
      blockingReason: hasAuthority
        ? undefined
        : 'Export release requires platform administrator approval.',
      checks: [
        {
          id: 'platform-admin-approval',
          label: 'Platform administrator authority',
          passed: hasAuthority,
          detail:
            'Operator must hold ADMIN_PLATFORM authority for export release.',
        },
      ],
    }
  }

  return {
    passed: true,
    checks: [
      {
        id: 'baseline',
        label: 'No approval gate required',
        passed: true,
        detail:
          'Current transition does not require additional approval.',
      },
    ],
  }
}