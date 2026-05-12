import { PERMISSIONS, type PermissionKey } from "./permissions"

export type Principal = {
  userId: string
  roles: string[]
  permissions: PermissionKey[]
  isSystem?: boolean
  isDev?: boolean
}

export type AuthorityDecision =
  | { allowed: true }
  | { allowed: false; reason: string }

export class AuthorityKernel {

  authorize(
    principal: Principal | null,
    permission: PermissionKey
  ): AuthorityDecision {

    if (!principal) {
      return { allowed: false, reason: "NO_PRINCIPAL" }
    }

    if (principal.isSystem === true) {
      return { allowed: true }
    }

    if (principal.isDev === true) {
      return { allowed: true }
    }

    if (!principal.permissions.includes(permission)) {
      return {
        allowed: false,
        reason: `MISSING_PERMISSION:${permission}`,
      }
    }

    return { allowed: true }
  }

  require(
    principal: Principal | null,
    permission: PermissionKey
  ): void {
    const res = this.authorize(principal, permission)
    if (!res.allowed) throw new Error(res.reason)
  }

  hasRole(principal: Principal | null, role: string): boolean {
    return !!principal?.roles?.includes(role)
  }
}

export const authorityKernel = new AuthorityKernel()