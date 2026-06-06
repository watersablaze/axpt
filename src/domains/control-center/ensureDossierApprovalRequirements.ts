import { prisma } from '@/lib/prisma'
import {
  getApprovalTemplateRequirements,
} from './ApprovalTemplates'
import {
  getTransitionKey,
} from './dossierApprovalGates'

type EnsureDossierApprovalRequirementsInput = {
  dossierId: string
  fromState: string
  toState: string
}

export async function ensureDossierApprovalRequirements({
  dossierId,
  fromState,
  toState,
}: EnsureDossierApprovalRequirementsInput) {
  const transitionKey =
    getTransitionKey(fromState, toState)

  const requirements =
    getApprovalTemplateRequirements(transitionKey)

  if (requirements.length === 0) {
    return []
  }

  return Promise.all(
    requirements.map((requirement) =>
      prisma.dossierApprovalRequirement.upsert({
        where: {
          dossierId_transitionKey_requiredRole: {
            dossierId,
            transitionKey,
            requiredRole: requirement.requiredRole,
          },
        },
        create: {
          dossierId,
          transitionKey,
          requiredRole: requirement.requiredRole,
          requiredCount: requirement.requiredCount,
          status: 'PENDING',
        },
        update: {
          requiredCount: requirement.requiredCount,
        },
      })
    )
  )
}