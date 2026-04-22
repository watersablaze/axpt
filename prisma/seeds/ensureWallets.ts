import { prisma } from '@/infrastructure/db/prisma'

async function main() {
  console.log('🔍 Ensuring all users have wallets...\n')

  const users = await prisma.user.findMany()

  for (const user of users) {
    const existing = await prisma.wallet.findFirst({
      where: { userId: user.id },
    })

    if (!existing) {
      const wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
        },
      })

      console.log(`✅ Created wallet for ${user.email} → ${wallet.id}`)
    } else {
      console.log(`• Wallet already exists for ${user.email}`)
    }
  }

  console.log('\n✨ Wallet integrity ensured.')
}

main()
  .catch((err) => {
    console.error('❌ ensureWallets failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })