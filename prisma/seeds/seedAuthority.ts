import { prisma } from '@/infrastructure/db/prisma'
import type { PermissionKey } from '@/domains/auth/permissions'

const ROLES = [
  {
    key: 'ADMIN_PLATFORM',
    label: 'Platform Administrator',
  },
  {
    key: 'RESIDENT',
    label: 'Resident',
  },
  {
    key: 'TREASURY_OPERATOR',
    label: 'Treasury Operator',
  },
  {
    key: 'TREASURY_APPROVER',
    label: 'Treasury Approver',
  },
  {
    key: 'GOVERNANCE_ELDER',
    label: 'Governance Elder',
  },
  {
    key: 'CONTRACT_OPERATOR',
    label: 'Contract Operator',
  },
  {
    key: 'AUDITOR_READONLY',
    label: 'Auditor',
  },
] as const

const ROLE_PERMISSIONS = {
  ADMIN_PLATFORM: [
    'admin.access',
    'SYSTEM_MANAGE_AUTH',
    'SYSTEM_READ_AUDIT',
    'SYSTEM_VIEW_REPLAY',
    'SYSTEM_VIEW_DRIFT',
  ],
  RESIDENT: [
    'PORTAL_ACCESS',
    'WALLET_INIT',
    'WALLET_TRANSFER',
    'INITIATIVE_FUND',
    'PROJECT_SUBMIT',
    'GOVERNANCE_REQUEST',
  ],
  TREASURY_OPERATOR: [
    'TREASURY_READ',
    'TREASURY_SYNC',
    'TREASURY_EXECUTE_INTENT',
  ],
  TREASURY_APPROVER: [
    'TREASURY_READ',
    'TREASURY_SYNC',
    'TREASURY_EXECUTE_INTENT',
    'TREASURY_PAUSE',
    'TREASURY_RUN_AUTONOMOUS_LOOP',
  ],
  GOVERNANCE_ELDER: [
    'GOVERNANCE_READ',
    'GOVERNANCE_PROPOSE',
    'GOVERNANCE_VOTE',
    'GOVERNANCE_APPROVE',
  ],
  CONTRACT_OPERATOR: [
    'CONTRACT_READ',
    'CONTRACT_SYNC',
    'CONTRACT_MINT',
    'CONTRACT_PAUSE',
  ],
  AUDITOR_READONLY: [
    'SYSTEM_READ_AUDIT',
    'SYSTEM_VIEW_REPLAY',
    'SYSTEM_VIEW_DRIFT',
    'TREASURY_READ',
    'CONTRACT_READ',
    'GOVERNANCE_READ',
  ],
} as const satisfies Record<string, readonly PermissionKey[]>

async function assignPermissions(
  roleKey: keyof typeof ROLE_PERMISSIONS,
  permissions: readonly PermissionKey[]
) {
  const role = await prisma.role.findUniqueOrThrow({
    where: { key: roleKey },
  })

  for (const permKey of permissions) {
    const perm = await prisma.permission.findUniqueOrThrow({
      where: { key: permKey },
    })

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: perm.id,
      },
    })
  }
}

async function main() {
  const permissionKeys = Array.from(
    new Set(
      Object.values(ROLE_PERMISSIONS).flatMap((permissions) => permissions)
    )
  )

  for (const key of permissionKeys) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: {
        key,
        label: key.replaceAll('_', ' '),
      },
    })
  }

  for (const roleDef of ROLES) {
    await prisma.role.upsert({
      where: { key: roleDef.key },
      update: {
        label: roleDef.label,
      },
      create: {
        key: roleDef.key,
        label: roleDef.label,
      },
    })
  }

  for (const [roleKey, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    await assignPermissions(
      roleKey as keyof typeof ROLE_PERMISSIONS,
      permissions
    )
  }

  console.log('✅ Auth authority seeded')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
