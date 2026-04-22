import { prisma } from '@/infrastructure/db/prisma'
import { GOVERNOR_CONFIG } from '@/domains/predictive/governorConfig'

export async function evaluateGovernor(signals: any[]) {
  const governor = await prisma.systemGovernor.findUnique({
    where: { id: 'global' },
  })

  const now = new Date()

  // HOLD STATE (critical)
  if (governor?.holdUntil && now < governor.holdUntil) {
    return governor.currentState
  }

  const hasCritical = signals.some((s) => s.severity === 'CRITICAL')
  const hasWarnings = signals.some((s) => s.severity === 'WARN')

  let nextState = governor?.currentState ?? 'STABLE'

  if (hasCritical) {
    nextState = 'PAUSED'
  } else if (hasWarnings) {
    nextState = 'UNSTABLE'
  } else {
    nextState = 'STABLE'
  }

  // HYSTERESIS (don’t flip too fast)
  if (governor?.currentState === 'PAUSED' && nextState === 'STABLE') {
    // require clean state for X time before resuming
    return 'PAUSED'
  }

  await prisma.systemGovernor.upsert({
    where: { id: 'global' },
    update: {
      currentState: nextState,
      lastTransition: now,
      holdUntil:
        nextState === 'PAUSED'
          ? new Date(now.getTime() + GOVERNOR_CONFIG.pauseHoldMs)
          : null,
    },
    create: {
      id: 'global',
      currentState: nextState,
      lastTransition: now,
    },
  })

  return nextState
}