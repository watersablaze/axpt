import {
  getTransitionRegistryEntry,
} from './transitionRegistry'

export type ApprovalTemplateRequirement = {
  requiredRole: string
  requiredCount: number
}

export function getApprovalTemplateRequirements(
  transitionKey: string
): ApprovalTemplateRequirement[] {
  const registryEntry =
    getTransitionRegistryEntry(transitionKey)

  return registryEntry?.requiredApprovals ?? []
}