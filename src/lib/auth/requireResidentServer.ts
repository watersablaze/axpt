import { prisma } from '@/infrastructure/db/prisma'
import { getPrincipal } from '@/domains/auth/getPrincipal'

export async function requireResidentServer() {
  const principal = await getPrincipal()

  if (!principal?.userId) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: {
      id: principal.userId,
    },

    include: {
      wallets: {
        include: {
          balances: true,
          blockchainWallet: true,
        },
      },

      userRoles: {
        include: {
          role: true,
        },
      },
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return {
    userId: user.id,
    user,
  }
}