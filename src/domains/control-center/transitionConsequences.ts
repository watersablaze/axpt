export type TransitionConsequence = {
  type: string
  label: string
  detail: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
}

type Input = {
  fromState: string
  toState: string
}

export function getTransitionConsequences({
  fromState,
  toState,
}: Input): TransitionConsequence[] {
  if (
    fromState === 'ESCROW_PENDING' &&
    toState === 'ESCROW_FUNDED'
  ) {
    return [
      {
        type: 'TREASURY_REVIEW_REQUIRED',
        label: 'Treasury review will be opened',
        detail:
          'A treasury review incident will be created so settlement readiness can be assessed.',
        severity: 'WARNING',
      },
      {
        type: 'DOSSIER_STATE_TRANSITIONED',
        label: 'Dossier will enter escrow funded state',
        detail:
          'The transaction dossier will move from escrow pending to escrow funded.',
        severity: 'INFO',
      },
    ]
  }

  if (
    fromState === 'ESCROW_FUNDED' &&
    toState === 'TREASURY_PENDING'
  ) {
    return [
      {
        type: 'APPROVAL_REQUIREMENTS_CREATED',
        label: 'Export approval requirement will be prepared',
        detail:
          'The system will create the required approval gate for treasury pending to export released.',
        severity: 'INFO',
      },
      {
        type: 'DOSSIER_STATE_TRANSITIONED',
        label: 'Dossier will enter treasury pending',
        detail:
          'The transaction will move into treasury review and authorization preparation.',
        severity: 'INFO',
      },
    ]
  }

  if (
    fromState === 'TREASURY_PENDING' &&
    toState === 'EXPORT_RELEASED'
  ) {
    return [
      {
        type: 'EXPORT_RELEASE_AUTHORIZED',
        label: 'Export release will be authorized',
        detail:
          'The dossier will move into export released status after artifact and approval gates have passed.',
        severity: 'INFO',
      },
      {
        type: 'DOMAIN_EVENT_APPENDED',
        label: 'Operational timeline will be updated',
        detail:
          'A domain event will be appended so the transition is visible in the operational timeline.',
        severity: 'INFO',
      },
    ]
  }

  return [
    {
      type: 'DOSSIER_STATE_TRANSITIONED',
      label: 'Dossier state will change',
      detail: `${fromState} will transition to ${toState}.`,
      severity: 'INFO',
    },
    {
      type: 'DOMAIN_EVENT_APPENDED',
      label: 'Operational timeline will be updated',
      detail:
        'A dossier domain event will be appended to the operational timeline.',
      severity: 'INFO',
    },
  ]
}