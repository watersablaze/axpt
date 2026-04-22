import { Roles, type Role } from "./roles"

export const ActionPermissions: Record<string, Role[]> = {
  LOCK_ESCROW: [Roles.TREASURY],
  RELEASE_ESCROW: [Roles.TREASURY, Roles.ADMIN],
  FLAG_REVIEW: [Roles.STRATEGY, Roles.ADMIN],
  UNDO_ACTION: [Roles.ADMIN],
}