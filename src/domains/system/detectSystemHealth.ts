import { prisma } from '@/infrastructure/db/prisma'
import type { SystemHealth } from './systemHealth'

export async function detectSystemHealth(): Promise<SystemHealth> {
  try {
    // test DB quickly
    await prisma.$queryRaw`SELECT 1`

    return {
      state: 'HEALTHY',
      services: {
        database: 'HEALTHY',
        chain: 'HEALTHY',
      },
    }
  } catch (err) {
    console.error('Health check failed:', err)

    return {
      state: 'DEGRADED',
      services: {
        database: 'DOWN',
        chain: 'DEGRADED',
      },
      reason: 'Database unreachable',
    }
  }
}