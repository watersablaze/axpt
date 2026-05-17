import {
  PERMISSIONS,
  type PermissionKey,
} from './permissions'

export const ActionPermissions = {
  LOCK_ESCROW: [PERMISSIONS.TREASURY_APPROVE],
  RELEASE_ESCROW: [PERMISSIONS.TREASURY_APPROVE],
  FLAG_REVIEW: [PERMISSIONS.SYSTEM_MANAGE_AUTH],
} as const satisfies Record<string, readonly PermissionKey[]>

export type AdminAction = keyof typeof ActionPermissions

export function isAdminAction(action: unknown): action is AdminAction {
  return typeof action === 'string' && action in ActionPermissions
}