import type { PermissionKey } from "./permissions"

export type PrincipalRole = string

export type Principal = {
  userId: string
  email: string
  displayName?: string | null

  roles: PrincipalRole[]
  permissions: PermissionKey[]

  sessionId?: string | null
}