import { requirePrincipal } from './requirePrincipal'
import type { Principal } from './types'

export async function requireRole(role: string): Promise<Principal> {
  const principal = await requirePrincipal()

  if (!principal.roles.includes(role)) {
    throw new Error(`MISSING_ROLE:${role}`)
  }

  return principal
}

export async function requireAnyRole(
  roles: string[]
): Promise<Principal> {
  const principal = await requirePrincipal()

  const allowed = principal.roles.some((role) =>
    roles.includes(role)
  )

  if (!allowed) {
    throw new Error(`MISSING_REQUIRED_ROLE:${roles.join(',')}`)
  }

  return principal
}