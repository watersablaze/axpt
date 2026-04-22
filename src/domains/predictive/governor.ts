import { prisma } from '@/infrastructure/db/prisma'
import { GOVERNOR_CONFIG } from './governorConfig'

type Signal = {
  severity: 'INFO' | 'WARN' | 'CRITICAL'
}

export type GovernorState =
  | 'STABLE'
  | 'UNSTABLE'
  | 'RESTRICTED'
  | 'PAUSED'

export async function evaluateGovernor(
  signals: Signal[]
): Promise<GovernorState> {
  const [governor, systemState] = await Promise.all([
    prisma.systemGovernor.findUnique({
      where: { id: 'global' },
    }),
    prisma.systemState.findUnique({
      where: { id: 'global' },
    }),
  ])

  const now = new Date()

  const currentState = (governor?.currentState ?? 'STABLE') as GovernorState

  const pausedAssets = (systemState?.pausedAssets as string[] | null) ?? []
  const pausedLayers = (systemState?.pausedLayers as string[] | null) ?? []
  const globalPaused = systemState?.globalPaused ?? false

  // HOLD STATE
  if (governor?.holdUntil && now < governor.holdUntil) {
    return currentState
  }

  const hasCritical = signals.some((s) => s.severity === 'CRITICAL')
  const hasWarnings = signals.some((s) => s.severity === 'WARN')

  let nextState: GovernorState = currentState

  // 1. Global pause always wins
  if (globalPaused || hasCritical) {
    nextState = 'PAUSED'
  }
  // 2. Partial controls imply restricted
  else if (pausedAssets.length > 0 || pausedLayers.length > 0) {
    nextState = 'RESTRICTED'
  }
  // 3. Warnings imply unstable
  else if (hasWarnings) {
    nextState = 'UNSTABLE'
  }
  // 4. Otherwise healthy
  else {
    nextState = 'STABLE'
  }

  // HYSTERESIS:
  // Do not immediately jump from PAUSED to STABLE.
  // Require at least one intermediate evaluation unless manually changed.
  if (currentState === 'PAUSED' && nextState === 'STABLE') {
    return 'PAUSED'
  }

  // No-op
  if (currentState === nextState) {
    return nextState
  }

  const holdUntil =
    nextState === 'PAUSED'
      ? new Date(now.getTime() + GOVERNOR_CONFIG.pauseHoldMs)
      : null

  await prisma.systemGovernor.upsert({
    where: { id: 'global' },
    update: {
      currentState: nextState,
      lastTransition: now,
      holdUntil,
    },
    create: {
      id: 'global',
      currentState: nextState,
      lastTransition: now,
      holdUntil,
    },
  })

  return nextState
}