import { prisma } from '@/infrastructure/db/prisma'
import { createResidentWallet } from '@/domains/wallet/createResidentWallet'

async function main() {
  const email = 'connect@axpt.io'

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  })

  if (!user) {
    throw new Error(`User not found: ${email}`)
  }

  const wallet = await createResidentWallet(user.id)

  console.log('✓ Wallet initialized for:', user.email)
  console.log({
    walletId: wallet.id,
    createdAt: wallet.createdAt,
    blockchainWallet: wallet.blockchainWallet
      ? {
          id: wallet.blockchainWallet.id,
          address: wallet.blockchainWallet.address,
          network: wallet.blockchainWallet.network,
        }
      : null,
    balances: wallet.balances.map((b: any) => ({
      id: b.id,
      tokenType: b.tokenType,
      amount: b.amount,
    })),
  })
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })