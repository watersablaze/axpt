export type ApprovalTemplateRequirement = {
  requiredRole: string
  requiredCount: number
}

export const dossierApprovalTemplates: Record<
  string,
  ApprovalTemplateRequirement[]
> = {
  TREASURY_PENDING_TO_EXPORT_RELEASED: [
    {
      requiredRole: 'ADMIN_PLATFORM',
      requiredCount: 1,
    },
  ],
}

export function getApprovalTemplateRequirements(
  transitionKey: string
): ApprovalTemplateRequirement[] {
  return dossierApprovalTemplates[transitionKey] ?? []
}