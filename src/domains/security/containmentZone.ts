import { createHash } from 'node:crypto'

export type ContainmentZoneSeverity = 'NORMAL' | 'WATCH' | 'HOT' | 'SEALED'

export type ContainmentZone = {
  zoneId: string
  avgRisk: number
  avgAnomaly: number
  avgThreat: number
  density: number
  severity: ContainmentZoneSeverity
  members: string[]
}

export function normalizeContainmentZoneMembers(
  members: string[]
): string[] {
  return Array.from(
    new Set(members.filter((member): member is string => typeof member === 'string' && member.length > 0))
  ).sort()
}

function hashParts(parts: string[]): string {
  return createHash('sha256')
    .update(parts.join('|'))
    .digest('hex')
    .slice(0, 24)
}

export function buildContainmentZoneId(members: string[]): string {
  const normalizedMembers = normalizeContainmentZoneMembers(members)

  if (normalizedMembers.length === 0) {
    return 'containment:empty'
  }

  return `containment:${hashParts(normalizedMembers)}`
}

export function buildContainmentZoneKey(zone: {
  zoneId: string
  members: string[]
}): string {
  return hashParts([
    zone.zoneId,
    ...normalizeContainmentZoneMembers(zone.members),
  ])
}

export function isContainmentZoneSeverity(
  value: unknown
): value is ContainmentZoneSeverity {
  return (
    value === 'NORMAL' ||
    value === 'WATCH' ||
    value === 'HOT' ||
    value === 'SEALED'
  )
}
