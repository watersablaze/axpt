import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'
import { PERMISSIONS } from '@/domains/auth/permissions'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { ok: false, error: 'Not allowed in production' },
      { status: 403 }
    )
  }

  try {
    const roles = [
      {
        key: 'ADMIN_PLATFORM',
        label: 'Platform Administrator',
        isSystem: true,
      },
      {
        key: 'TREASURY_OPERATOR',
        label: 'Treasury Operator',
        isSystem: true,
      },
      {
        key: 'RESIDENT',
        label: 'Resident',
        isSystem: true,
      },
    ]

    const permissionValues = Object.values(PERMISSIONS)

    const [createdRoles, createdPermissions] =
      await prisma.$transaction(async (tx: any) => {
        const createdRoles = await Promise.all(
          roles.map((role) =>
            tx.role.upsert({
              where: { key: role.key },
              update: {
                label: role.label,
                isSystem: role.isSystem,
              },
              create: role,
            })
          )
        )

        const createdPermissions = await Promise.all(
          permissionValues.map((key) =>
            tx.permission.upsert({
              where: { key },
              update: {},
              create: {
                key,
                label: key,
              },
            })
          )
        )

        const roleByKey = new Map(
          createdRoles.map((role) => [
            role.key,
            role,
          ])
        )

        const permissionByKey = new Map(
          createdPermissions.map((permission) => [
            permission.key,
            permission,
          ])
        )

        const adminRole = roleByKey.get('ADMIN_PLATFORM')
        const treasuryRole = roleByKey.get('TREASURY_OPERATOR')
        const residentRole = roleByKey.get('RESIDENT')

        if (!adminRole || !treasuryRole || !residentRole) {
          throw new Error('Missing seeded role')
        }

        const rolePermissions: Array<{
          roleId: string
          permissionId: string
        }> = []

        for (const permission of createdPermissions) {
          rolePermissions.push({
            roleId: adminRole.id,
            permissionId: permission.id,
          })
        }

        const treasuryPermissionKeys = [
          PERMISSIONS.TREASURY_READ,
          PERMISSIONS.TREASURY_ORIGINATE,
      PERMISSIONS.TREASURY_REVIEW,
      PERMISSIONS.TREASURY_ASSESS,
          PERMISSIONS.TREASURY_APPROVE,
          PERMISSIONS.TREASURY_EXECUTE,
          PERMISSIONS.TREASURY_QUEUE_PROCESS,
          PERMISSIONS.TREASURY_PAUSE,
          PERMISSIONS.TREASURY_SYNC,
          PERMISSIONS.WALLET_TRANSFER,
          PERMISSIONS.SYSTEM_VIEW_DRIFT,
          PERMISSIONS.SYSTEM_VIEW_REPLAY,
        ]

        for (const key of treasuryPermissionKeys) {
          const permission = permissionByKey.get(key)

          if (permission) {
            rolePermissions.push({
              roleId: treasuryRole.id,
              permissionId: permission.id,
            })
          }
        }

        const residentPermissionKeys = [
          PERMISSIONS.PORTAL_ACCESS,
          PERMISSIONS.WALLET_INIT,
          PERMISSIONS.WALLET_TRANSFER,
          PERMISSIONS.PROJECT_SUBMIT,
          PERMISSIONS.INITIATIVE_FUND,
        ]

        for (const key of residentPermissionKeys) {
          const permission = permissionByKey.get(key)

          if (permission) {
            rolePermissions.push({
              roleId: residentRole.id,
              permissionId: permission.id,
            })
          }
        }

        await Promise.all(
          rolePermissions.map((link) =>
            tx.rolePermission.upsert({
              where: {
                roleId_permissionId: {
                  roleId: link.roleId,
                  permissionId: link.permissionId,
                },
              },
              update: {},
              create: link,
            })
          )
        )

        return [createdRoles, createdPermissions]
      })

    return NextResponse.json({
      ok: true,
      roles: createdRoles.length,
      permissions: createdPermissions.length,
    })
  } catch (err) {
    console.error('[DEV_SEED_ROLES_ERROR]', err)

    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'seed roles failed',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST()
}