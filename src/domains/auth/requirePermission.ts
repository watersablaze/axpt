import { requireAuth } from './requireAuth'
import type { PermissionKey } from './permissions'

export async function requirePermission(permission: PermissionKey) {
  const principal = await requireAuth()

  if (!principal.permissions.includes(permission)) {
    const error = new Error(`Forbidden: missing permission ${permission}`)
    ;(error as any).status = 403
    throw error
  }

  return principal
}