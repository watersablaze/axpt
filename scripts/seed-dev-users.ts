import { prisma } from '@/infrastructure/db/prisma'
import { createResidentWallet } from '@/domains/wallet/createResidentWallet'
import { creditAxg } from '@/domains/wallet/creditAxg'
import { getAsset } from '@/lib/assets/registry'
import {
  decimalToBigInt,
  formatBaseUnits,
  parseDisplayToBaseUnits,
} from '@/lib/money/baseUnits'

async function topUpAxgToTarget(
  userId: string,
  targetAmount: number,
  note: string
) {
  const asset = getAsset('AXG')
  const targetBaseUnits = parseDisplayToBaseUnits(
    String(targetAmount),
    asset.decimals
  )

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      balances: true,
    },
  })

  if (!wallet) {
    throw new Error(`Wallet not found for user: ${userId}`)
  }

  const axg = wallet.balances.find(
    (balance: {
      assetCode?: string
      tokenType?: string | null
    }) =>
      balance.assetCode === 'AXG' ||
      balance.tokenType === 'AXG'
  )

  const currentBaseUnits = axg?.amountBaseUnits
    ? decimalToBigInt(axg.amountBaseUnits)
    : parseDisplayToBaseUnits(String(axg?.amount ?? 0), asset.decimals)

  const topUpBaseUnits = targetBaseUnits - currentBaseUnits

  if (topUpBaseUnits <= 0n) {
    return
  }

  const displayAmount = formatBaseUnits(topUpBaseUnits, asset.decimals)

  await creditAxg(
    userId,
    Number(displayAmount),
    note
  )
}

async function main() {
  const walletTransfer = await prisma.permission.upsert({
    where: { key: 'WALLET_TRANSFER' },
    update: {},
    create: {
      key: 'WALLET_TRANSFER',
      label: 'Wallet Transfer',
    },
  })

  const residentRole = await prisma.role.upsert({
    where: { key: 'RESIDENT' },
    update: {},
    create: {
      key: 'RESIDENT',
      label: 'Resident',
    },
  })

  const adminRole = await prisma.role.upsert({
    where: { key: 'ADMIN_PLATFORM' },
    update: {},
    create: {
      key: 'ADMIN_PLATFORM',
      label: 'Platform Admin',
    },
  })

  const residentA = await prisma.user.upsert({
    where: {
      email: 'resident.a@example.com',
    },
    update: {},
    create: {
      email: 'resident.a@example.com',
      username: 'resident_a',
      passwordHash: 'DEV_ONLY_HASH',
      displayName: 'Resident A',
      tier: 'Nomad',
    },
  })

  const residentB = await prisma.user.upsert({
    where: {
      email: 'resident.b@example.com',
    },
    update: {},
    create: {
      email: 'resident.b@example.com',
      username: 'resident_b',
      passwordHash: 'DEV_ONLY_HASH',
      displayName: 'Resident B',
      tier: 'Nomad',
    },
  })

  const admin = await prisma.user.upsert({
    where: {
      email: 'connect@axpt.io',
    },
    update: {},
    create: {
      email: 'connect@axpt.io',
      username: 'axpt_admin',
      passwordHash: 'DEV_ONLY_HASH',
      displayName: 'AXPT Admin',
      tier: 'Sovereign',
    },
  })

  const roleLinks = [
    { userId: residentA.id, roleId: residentRole.id },
    { userId: residentB.id, roleId: residentRole.id },
    { userId: admin.id, roleId: adminRole.id },
  ]

  for (const link of roleLinks) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: link,
      },
      update: {
        isActive: true,
        revokedAt: null,
      },
      create: {
        ...link,
        isActive: true,
      },
    })
  }

  const permissionLinks = [
    { roleId: residentRole.id, permissionId: walletTransfer.id },
    { roleId: adminRole.id, permissionId: walletTransfer.id },
  ]

  for (const link of permissionLinks) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: link,
      },
      update: {},
      create: link,
    })
  }

  await prisma.councilElder.upsert({
    where: { userId: residentB.id },
    update: { isActive: true },
    create: {
      userId: residentB.id,
      title: 'Resident Elder',
      isActive: true,
    },
  })

  await prisma.councilElder.upsert({
    where: { userId: admin.id },
    update: { isActive: true },
    create: {
      userId: admin.id,
      title: 'Platform Elder',
      isActive: true,
    },
  })

  /*
   * Wallet bootstrap
   */
  await createResidentWallet(residentA.id)
  await createResidentWallet(residentB.id)
  await createResidentWallet(admin.id)

  /*
   * Dev funding
   */
  await topUpAxgToTarget(admin.id, 1000, 'DEV_SEED_ADMIN_AXG')
  await topUpAxgToTarget(residentA.id, 1000, 'DEV_SEED_RESIDENT_A_AXG')
  await topUpAxgToTarget(residentB.id, 1000, 'DEV_SEED_RESIDENT_B_AXG')

  console.log('Seeded dev users, roles, permissions, elders, wallets, and funding')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
