import { prisma } from '@/infrastructure/db/prisma'
import { getSessionFromCookie } from '@/lib/auth/session'

import type { Principal } from './types'
import type { PermissionKey } from './permissions'
import { resolveRepresentativeSessionValidity } from './resolveRepresentativeSessionValidity'

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
      representativeProgramParticipants: {
        select: {
          standing: true,
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
              permission: { key: string }
            }>
          }
        }) =>
          userRole.role.rolePermissions.map(
            (rolePermission: { permission: { key: string } }) =>
              rolePermission.permission.key as PermissionKey
          )
      )
    )
  )

  const sessionRemainsValid =
    resolveRepresentativeSessionValidity({
      sessionTier:
        session.tier,
      roles,
      permissions,
      representativeProgramParticipants:
        user.representativeProgramParticipants,
    })

  if (!sessionRemainsValid) {
    console.log(
      '[auth/getPrincipal] representative session no longer eligible',
      {
        userId:
          user.id,
      },
    )

    return null
  }

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