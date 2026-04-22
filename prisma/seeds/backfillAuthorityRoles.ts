import { prisma } from '@/infrastructure/db/prisma'

async function assignRole(userId: string, roleKey: string) {
  const role = await prisma.role.findUniqueOrThrow({
    where: { key: roleKey },
  })

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId: role.id,
      },
    },
    update: {
      isActive: true,
      revokedAt: null,
    },
    create: {
      userId,
      roleId: role.id,
    },
  })
}

function isResidentTier(tier: string | null | undefined) {
  if (!tier) return false

  const normalized = tier.trim().toLowerCase()

  return [
    'investor',
    'partner',
    'farmer',
    'merchant',
    'nomad',
    'resident',
  ].includes(normalized)
}

async function main() {
  const users = await prisma.user.findMany({
    include: {
      councilElder: true,
    },
  })

  for (const user of users) {
    if (user.isAdmin) {
      await assignRole(user.id, 'ADMIN_PLATFORM')
    }

    if (user.councilElder?.isActive) {
      await assignRole(user.id, 'GOVERNANCE_ELDER')
    }

    if (isResidentTier(user.tier)) {
      await assignRole(user.id, 'RESIDENT')
    }

    if (user.email.toLowerCase() === 'connect@axpt.io') {
      await assignRole(user.id, 'TREASURY_APPROVER')
      await assignRole(user.id, 'CONTRACT_OPERATOR')
    }
  }

  console.log('✅ Authority roles backfilled')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
