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

type ApprovalRequirementForGate = {
  transitionKey: string
  requiredRole: string
  requiredCount: number
  status: string
}

type ApprovalGateInput = {
  fromState: string
  toState: string
  operatorRoles?: string[]
  requirements?: ApprovalRequirementForGate[]
}

export function getTransitionKey(
  fromState: string,
  toState: string
) {
  return `${fromState}_TO_${toState}`
}

export function checkDossierApprovalGate({
  fromState,
  toState,
  operatorRoles = [],
  requirements = [],
}: ApprovalGateInput): ApprovalGateResult {
  if (
    fromState === 'TREASURY_PENDING' &&
    toState === 'EXPORT_RELEASED'
  ) {
    const transitionKey =
      getTransitionKey(fromState, toState)

    const requirement =
      requirements.find(
        (item) =>
          item.transitionKey === transitionKey &&
          item.requiredRole === 'ADMIN_PLATFORM'
      )

    const satisfied =
      requirement?.status === 'SATISFIED'

    return {
      passed: satisfied,
      blockingReason: satisfied
        ? undefined
        : 'Export release requires a stored platform approval.',
      checks: [
        {
          id: 'stored-platform-approval',
          label: 'Stored platform approval',
          passed: satisfied,
          detail: satisfied
            ? 'Approval requirement has been satisfied.'
            : 'An ADMIN_PLATFORM approval must be granted before export release.',
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