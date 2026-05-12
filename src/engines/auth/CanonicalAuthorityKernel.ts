// src/engines/auth/CanonicalAuthorityKernel.ts

export type Principal = {
  userId: string
  roles: string[]
  permissions: string[]
  isSystem?: boolean
  isDev?: boolean
}

export type AuthorityDecision =
  | { allowed: true }
  | { allowed: false; reason: string }

export class CanonicalAuthorityKernel {

  /**
   * 🧠 SINGLE ENTRY POINT FOR AUTHORIZATION
   */
  authorize(
    principal: Principal | null,
    permission: string
  ): AuthorityDecision {

    if (!principal) {
      return { allowed: false, reason: "NO_PRINCIPAL" }
    }

    // ─────────────────────────────
    // SYSTEM OVERRIDE (CONTROLLED ONLY)
    // ─────────────────────────────
    if (principal.isSystem === true) {
      return { allowed: true }
    }

    // ─────────────────────────────
    // DEV OVERRIDE (STRICTLY ISOLATED)
    // ─────────────────────────────
    if (principal.isDev === true) {
      return { allowed: true }
    }

    // ─────────────────────────────
    // CORE PERMISSION CHECK
    // ─────────────────────────────
    if (!principal.permissions.includes(permission)) {
      return {
        allowed: false,
        reason: `MISSING_PERMISSION:${permission}`,
      }
    }

    return { allowed: true }
  }

  /**
   * 🧠 ROLE CHECK (OPTIONAL, NON-AUTH DECISIVE)
   */
  hasRole(principal: Principal | null, role: string): boolean {
    return !!principal?.roles?.includes(role)
  }
}

export const canonicalAuthorityKernel =
  new CanonicalAuthorityKernel()