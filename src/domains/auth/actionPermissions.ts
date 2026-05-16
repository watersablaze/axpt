export const ActionPermissions: Record<string, readonly string[]> = {
  LOCK_ESCROW: ['ADMIN_PLATFORM'],
  RELEASE_ESCROW: ['ADMIN_PLATFORM'],
  FLAG_REVIEW: ['ADMIN_PLATFORM'],
}

export type AdminAction = keyof typeof ActionPermissions

export function isAdminAction(action: unknown): action is AdminAction {
  return typeof action === 'string' && action in ActionPermissions
}