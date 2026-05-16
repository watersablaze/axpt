import type { Role } from "@/core/auth/roles"

/**
 * @deprecated
 * LEGACY DEV BYPASS
 *
 * DO NOT USE FOR CONTROL CENTER,
 * TREASURY, OR GOVERNANCE FLOWS.
 *
 * Replace with getPrincipal().
 */

export function getDevUser(): { id: string; email: string; role: Role } {
  return {
    id: "dev-user",
    email: "connect@axpt.io",
    role: "TREASURY",
  }
}