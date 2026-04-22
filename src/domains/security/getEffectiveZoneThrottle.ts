import { getUserMetadata } from './mergeUserMetadata'
import {
  type ContainmentZoneSeverity,
  isContainmentZoneSeverity,
} from './containmentZone'

export type EffectiveZoneThrottle = {
  zoneId: string | null
  severity: ContainmentZoneSeverity
  feeMultiplier: number
  throttleMultiplier: number
  cooldownMs: number
  rejectTransfers: boolean
}

function mapSeverityToPolicy(
  severity: ContainmentZoneSeverity
): Omit<EffectiveZoneThrottle, 'zoneId' | 'severity'> {
  switch (severity) {
    case 'WATCH':
      return {
        feeMultiplier: 1.1,
        throttleMultiplier: 1.15,
        cooldownMs: 750,
        rejectTransfers: false,
      }

    case 'HOT':
      return {
        feeMultiplier: 1.35,
        throttleMultiplier: 1.4,
        cooldownMs: 2500,
        rejectTransfers: false,
      }

    case 'SEALED':
      return {
        feeMultiplier: 2,
        throttleMultiplier: 3,
        cooldownMs: 10000,
        rejectTransfers: true,
      }

    case 'NORMAL':
    default:
      return {
        feeMultiplier: 1,
        throttleMultiplier: 1,
        cooldownMs: 0,
        rejectTransfers: false,
      }
  }
}

export async function getEffectiveZoneThrottle(
  userId: string
): Promise<EffectiveZoneThrottle> {
  const meta = await getUserMetadata(userId)

  const zoneId =
    typeof meta.containmentZoneId === 'string'
      ? meta.containmentZoneId
      : typeof meta.zoneId === 'string'
      ? meta.zoneId
      : null

  const severity =
    isContainmentZoneSeverity(meta.containmentZoneSeverity)
      ? meta.containmentZoneSeverity
      : isContainmentZoneSeverity(meta.zoneSeverity)
      ? meta.zoneSeverity
      : 'NORMAL'

  const policy = mapSeverityToPolicy(severity)

  return {
    zoneId,
    severity,
    ...policy,
  }
}
