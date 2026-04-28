import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function ensurePermission(
  key: string,
  label: string
) {
  return prisma.permission.upsert({
    where: { key },

    update: {
      label,
    },

    create: {
      key,
      label,
    },
  })
}

async function attachPermission(
  roleId: string,
  permissionId: string
) {
  return prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId,
        permissionId,
      },
    },

    update: {},

    create: {
      roleId,
      permissionId,
    },
  })
}

async function main() {
  /*
   * Ensure permissions exist
   */

  const walletTransfer = await ensurePermission(
    'WALLET_TRANSFER',
    'Wallet Transfer'
  )

  const treasuryApprove = await ensurePermission(
    'TREASURY_APPROVE',
    'Treasury Approve'
  )

  const treasuryQueueProcess = await ensurePermission(
    'TREASURY_QUEUE_PROCESS',
    'Treasury Queue Process'
  )

  /*
   * Resolve roles
   */

  const residentRole = await prisma.role.findUnique({
    where: {
      key: 'RESIDENT',
    },
  })

  const adminRole = await prisma.role.findUnique({
    where: {
      key: 'ADMIN_PLATFORM',
    },
  })

  if (!residentRole || !adminRole) {
    throw new Error('Required roles missing')
  }

/*
 * RESIDENT permissions
 */

await attachPermission(
  residentRole.id,
  walletTransfer.id
)

/*
 * TEMP DEV:
 * allow residents to approve treasury actions
 */

await attachPermission(
  residentRole.id,
  treasuryApprove.id
)

  /*
   * ADMIN_PLATFORM permissions
   */

  await attachPermission(
    adminRole.id,
    walletTransfer.id
  )

  await attachPermission(
    adminRole.id,
    treasuryApprove.id
  )

  await attachPermission(
    adminRole.id,
    treasuryQueueProcess.id
  )

  console.log('Role permissions seeded')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })