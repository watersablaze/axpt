import { prisma } from '@/infrastructure/db/prisma'
import { getPrincipal } from '@/domains/auth/getPrincipal'
import { redirect } from 'next/dist/client/components/redirect';

export async function requireResidentServer() {
  const principal = await getPrincipal()

  if (!principal) {
    redirect("/login")
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
    throw new Error("User not found")
  }

  return {
    userId: user.id,
    user,
  }
}