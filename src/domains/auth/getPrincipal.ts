import { prisma } from '@/infrastructure/db/prisma'
import { getSessionFromCookie } from '@/lib/auth/session'

import type { Principal } from './types'
import type { PermissionKey } from './permissions'

export async function getPrincipal(): Promise<Principal | null> {
  const session = await getSessionFromCookie()

  console.log('[auth/getPrincipal] resolving principal', {
    sessionPresent: !!session,
    userId: session?.userId ?? null,
  })

  if (!session?.userId) {
    console.log('[auth/getPrincipal] no valid session')
    return null
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    include: {
      userRoles: {
        where: {
          isActive: true,
          revokedAt: null,
        },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!user) {
    console.log('[auth/getPrincipal] user not found for session')
    return null
  }

  const roles = user.userRoles.map(
    (userRole: { role: { key: string } }) => userRole.role.key
  )

  const permissions: PermissionKey[] = Array.from(
    new Set(
      user.userRoles.flatMap(
        (userRole: {
          role: {
            rolePermissions: Array<{
              permission: { key: PermissionKey }
            }>
          }
        }) =>
          userRole.role.rolePermissions.map(
            (rolePermission: { permission: { key: PermissionKey } }) =>
              rolePermission.permission.key
          )
      )
    )
  )

  console.log('[auth/getPrincipal] principal resolved', {
    email: user.email,
    roles,
    permissionCount: permissions.length,
  })

  return {
    userId: user.id,
    email: user.email,
    displayName: user.displayName ?? user.name ?? null,
    roles,
    permissions,
    sessionId: null,
  }
}