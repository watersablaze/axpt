import { prisma } from '@/infrastructure/db/prisma'

export async function getUserMetadata(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { metadata: true },
  })

  return (user?.metadata as Record<string, unknown> | null) ?? {}
}

export async function mergeUserMetadata(
  userId: string,
  patch: Record<string, unknown>
) {
  const current = await getUserMetadata(userId)

  const next = {
    ...current,
    ...patch,
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      metadata: next,
    },
  })

  return next
}