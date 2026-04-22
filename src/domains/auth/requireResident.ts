import { requirePermission } from '@/domains/auth/requirePermission'
import { PERMISSIONS } from '@/domains/auth/permissions'

export async function requireResident() {
  return requirePermission(PERMISSIONS.PORTAL_ACCESS)
}