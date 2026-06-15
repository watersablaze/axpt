import {
  getOperatorAuthorityProfile,
} from './getOperatorAuthorityProfile'

import type {
  Principal,
} from '@/domains/auth/types'

import type {
  OperatorActivitySummary,
} from './getOperatorActivitySummary'

type Input = {
  principal: Principal
  activity?: OperatorActivitySummary
}

export function getOperatorContext({
  principal,
  activity,
}: Input) {
  return {
    email: principal.email,
    roles: principal.roles,
    permissionCount: principal.permissions.length,

    authority: getOperatorAuthorityProfile({
      roles: principal.roles,
      permissions: principal.permissions,
    }),

    session: {
      active: true,
      totalActions: activity?.totalActions ?? 0,
      approvalsGranted:
        activity?.approvalsGranted ?? 0,
      transitionsExecuted:
        activity?.transitionsExecuted ?? 0,
      artifactsGenerated:
        activity?.artifactsGenerated ?? 0,
      incidentsResolved:
        activity?.incidentsResolved ?? 0,
      lastActionAt:
        activity?.lastActionAt ?? null,
      lastActionLabel:
        activity?.lastActionLabel ?? null,
    },
  }
}
