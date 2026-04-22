import type { Role } from "@/core/auth/roles"

export function getDevUser(): { id: string; email: string; role: Role } {
  return {
    id: "dev-user",
    email: "connect@axpt.io",
    role: "TREASURY",
  }
}