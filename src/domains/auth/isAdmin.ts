// src/domains/auth/isAdmin.ts

type AdminLikePrincipal = {
  roles?: string[]
  permissions?: string[]
} | null | undefined

export function isAdmin(principal: AdminLikePrincipal): boolean {
  if (!principal) return false

  return (
    principal.roles?.includes('ADMIN_PLATFORM') ||
    principal.roles?.includes('ADMIN') ||
    principal.permissions?.includes('admin.access') ||
    false
  )
}