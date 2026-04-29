import { prisma } from '@/infrastructure/db/prisma'

export class MemoryGraphQuery {
  async findRiskyChains(entityId: string) {
    return prisma.memoryNode.findMany({
      where: {
        entityId,
        type: { in: ['DISPUTE', 'RISK'] },
      },
      orderBy: { timestamp: 'desc' },
    })
  }

  async recentTransfers(entityId: string) {
    return prisma.memoryNode.findMany({
      where: {
        entityId,
        type: 'TRANSFER',
      },
      take: 50,
      orderBy: { timestamp: 'desc' },
    })
  }
}