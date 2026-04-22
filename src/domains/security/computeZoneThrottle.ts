import { type ContainmentZone } from './containmentZone'

export type ZoneThrottle = {
  zoneId: string
  multiplier: number
  cooldownMs: number
}

export function computeZoneThrottle(
  zones: ContainmentZone[]
): ZoneThrottle[] {
  return zones.map((zone) => {
    let multiplier = 1
    let cooldownMs = 0

    switch (zone.severity) {
      case 'WATCH':
        multiplier = 1.2
        cooldownMs = 500
        break
      case 'HOT':
        multiplier = 1.5
        cooldownMs = 1500
        break
      case 'SEALED':
        multiplier = 3
        cooldownMs = 5000
        break
    }

    return {
      zoneId: zone.zoneId,
      multiplier,
      cooldownMs,
    }
  })
}
