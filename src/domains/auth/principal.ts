import type { PermissionKey } from './permissions'

export type AXPTPrincipal = {
  userId: string
  email: string
  displayName: string | null
  roles: string[]
  permissions: PermissionKey[]
  sessionId?: string | null
}