export type TransitionRegistryEntry = {
  transitionKey: string
  fromState: string
  toState: string
  requiredApprovals: Array<{
    requiredRole: string
    requiredCount: number
  }>
  generatedArtifacts: Array<{
    type: string
    title: string
    status: string
    version: string
  }>
  consequences: Array<{
    type: string
    label: string
    detail: string
    severity: 'INFO' | 'WARNING' | 'CRITICAL'
  }>
}

export const transitionRegistry: Record<
  string,
  TransitionRegistryEntry
> = {
  TREASURY_PENDING_TO_EXPORT_RELEASED: {
    transitionKey: 'TREASURY_PENDING_TO_EXPORT_RELEASED',
    fromState: 'TREASURY_PENDING',
    toState: 'EXPORT_RELEASED',

    requiredApprovals: [
      {
        requiredRole: 'ADMIN_PLATFORM',
        requiredCount: 1,
      },
    ],

    generatedArtifacts: [
      {
        type: 'EXPORT_RELEASE_NOTICE',
        title: 'Export Release Notice',
        status: 'DRAFT',
        version: 'v1',
      },
    ],

    consequences: [
      {
        type: 'EXPORT_RELEASE_AUTHORIZED',
        label: 'Export release will be authorized',
        detail:
          'The dossier will move into export released status after artifact and approval gates have passed.',
        severity: 'INFO',
      },
      {
        type: 'INSTRUMENT_GENERATED',
        label: 'Export Release Notice will be generated',
        detail:
          'The system will create a draft Export Release Notice attached to the dossier.',
        severity: 'INFO',
      },
      {
        type: 'DOMAIN_EVENT_APPENDED',
        label: 'Operational timeline will be updated',
        detail:
          'A dossier domain event will be appended to the operational timeline.',
        severity: 'INFO',
      },
    ],
  },
    EXPORT_RELEASED_TO_EXPORT_ACTIVE: {
      transitionKey: 'EXPORT_RELEASED_TO_EXPORT_ACTIVE',
      fromState: 'EXPORT_RELEASED',
      toState: 'EXPORT_ACTIVE',

      requiredApprovals: [],

      generatedArtifacts: [
        {
          type: 'EXPORT_ACTIVATION_NOTICE',
          title: 'Export Activation Notice',
          status: 'DRAFT',
          version: 'v1',
        },
      ],

      consequences: [
        {
          type: 'EXPORT_ACTIVATION_RECORDED',
          label: 'Export activity will be opened',
          detail:
            'The dossier will move from export released into export active status.',
          severity: 'INFO',
        },
        {
          type: 'INSTRUMENT_GENERATED',
          label: 'Export Activation Notice will be generated',
          detail:
            'The system will create a draft Export Activation Notice attached to the dossier.',
          severity: 'INFO',
        },
        {
          type: 'DOMAIN_EVENT_APPENDED',
          label: 'Operational timeline will be updated',
          detail:
            'A dossier domain event will be appended to the operational timeline.',
          severity: 'INFO',
        },
      ],
    },
  }

export function getTransitionRegistryEntry(
  transitionKey: string
) {
  return transitionRegistry[transitionKey] ?? null
}