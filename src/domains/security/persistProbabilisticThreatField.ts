import { prisma } from '@/infrastructure/db/prisma'

export async function persistProbabilisticThreatField(nodes: any[]) {
  for (const node of nodes) {
    const user = await prisma.user.findUnique({
      where: { id: node.userId },
      select: { metadata: true },
    })

    const meta = (user?.metadata as any) ?? {}

    await prisma.user.update({
      where: { id: node.userId },
      data: {
        metadata: {
          ...meta,
          threatScore: node.finalThreat,
          propagatedThreat: node.propagatedThreat,
          threatUpdatedAt: new Date().toISOString(),
        },
      },
    })
  }
}