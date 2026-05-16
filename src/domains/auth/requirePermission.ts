import { requirePrincipal } from './requirePrincipal'
import type { PermissionKey } from './permissions'
import type { Principal } from './types'

export async function requirePermission(
  permission: PermissionKey
): Promise<Principal> {
  const principal = await requirePrincipal()

  if (!principal.permissions.includes(permission)) {
    throw new Error(`MISSING_PERMISSION:${permission}`)
  }

  return principal
}

export async function requireAnyPermission(
  permissions: PermissionKey[]
): Promise<Principal> {
  const principal = await requirePrincipal()

  const allowed = principal.permissions.some((permission) =>
    permissions.includes(permission)
  )

  if (!allowed) {
    throw new Error(`MISSING_REQUIRED_PERMISSION:${permissions.join(',')}`)
  }

  return principal
}