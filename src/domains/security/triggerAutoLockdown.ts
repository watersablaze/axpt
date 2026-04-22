import { prisma } from '@/infrastructure/db/prisma'

export async function triggerAutoLockdown(state: {
  level: string
  reason?: string
}) {
  const mode = state.level === 'CRITICAL' ? 'LOCKDOWN' : 'DEFENSIVE'

  await prisma.systemSetting.upsert({
    where: { key: 'SYSTEM_MODE' },
    update: {
      value: JSON.stringify({
        mode,
        updatedAt: new Date().toISOString(),
      }),
    },
    create: {
      key: 'SYSTEM_MODE',
      value: JSON.stringify({ mode }),
    },
  })

  await prisma.eventLog.create({
    data: {
      type: 'SYSTEM_MODE_CHANGED',
      metadata: {
        mode,
        reason: state.reason ?? null,
      },
    },
  })
}