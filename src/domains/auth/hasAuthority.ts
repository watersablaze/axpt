import type { PermissionKey } from './permissions'

type AuthorityLike = {
  roles?: string[]
  permissions?: string[]
} | null | undefined

export function hasPermission(
  principal: AuthorityLike,
  permission: PermissionKey
): boolean {
  return Boolean(
    principal?.permissions?.includes(permission)
  )
}

export function hasRole(
  principal: AuthorityLike,
  role: string
): boolean {
  return Boolean(
    principal?.roles?.includes(role)
  )
}

export function hasAnyRole(
  principal: AuthorityLike,
  roles: string[]
): boolean {
  return Boolean(
    principal?.roles?.some((role) =>
      roles.includes(role)
    )
  )
}