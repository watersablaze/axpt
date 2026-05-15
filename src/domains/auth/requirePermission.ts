import { requireAuth } from './requireAuth'
import type { PermissionKey } from './permissions'

export async function requirePermission(permission: PermissionKey) {
  const principal = await requireAuth()

if (!principal || !Array.isArray(principal.permissions)) {
  return false
}

if (!principal.permissions.includes(permission)) {
  return false
}

  return principal
}