import type { SystemPressure } from './computeSystemPressure'

export type GlobalThrottle = {
  multiplier: number
  cooldownMs: number
  approvalBias: 'NONE' | 'ELEVATED' | 'STRICT'
}

export function computeGlobalThrottle(
  pressure: SystemPressure
): GlobalThrottle {
  switch (pressure.mode) {
    case 'LOCKDOWN':
      return {
        multiplier: 2.5,
        cooldownMs: 60_000,
        approvalBias: 'STRICT',
      }
    case 'DEFENSIVE':
      return {
        multiplier: 1.8,
        cooldownMs: 30_000,
        approvalBias: 'STRICT',
      }
    case 'ELEVATED':
      return {
        multiplier: 1.3,
        cooldownMs: 15_000,
        approvalBias: 'ELEVATED',
      }
    default:
      return {
        multiplier: 1,
        cooldownMs: 5_000,
        approvalBias: 'NONE',
      }
  }
}