import { prisma } from '@/infrastructure/db/prisma'
import {
  type ContainmentZone,
  type ContainmentZoneSeverity,
  normalizeContainmentZoneMembers,
} from './containmentZone'

type Meta = {
  riskScore?: number
  anomalyScore?: number
  threatScore?: number
  clusterId?: string
}

function classifyZoneSeverity(params: {
  avgRisk: number
  avgAnomaly: number
  avgThreat: number
  density: number
  memberCount: number
}): ContainmentZoneSeverity {
  const { avgRisk, avgAnomaly, avgThreat, density, memberCount } = params

  if (memberCount === 1) {
    if (avgThreat > 10) {
      return 'SEALED'
    }

    if (avgThreat > 6 || avgAnomaly > 0.4 || avgRisk > 4) {
      return 'WATCH'
    }

    return 'NORMAL'
  }

  if (avgThreat > 10 || (avgRisk > 7 && density > 0.6)) {
    return 'SEALED'
  }

  if (avgThreat > 6 || avgAnomaly > 0.6) {
    return 'HOT'
  }

  if (avgRisk > 4 || avgAnomaly > 0.4) {
    return 'WATCH'
  }

  return 'NORMAL'
}

export async function computeContainmentZone(): Promise<ContainmentZone[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      metadata: true,
    },
  })

  const clusters = new Map<string, { id: string; metadata: Meta | null }[]>()

  for (const user of users) {
    const meta = (user.metadata as Meta) ?? {}
    const clusterId = meta.clusterId

    if (!clusterId) continue

    if (!clusters.has(clusterId)) {
      clusters.set(clusterId, [])
    }

    clusters.get(clusterId)!.push(user)
  }

  const zones: ContainmentZone[] = []

  for (const [clusterId, members] of clusters.entries()) {
    const normalizedMembers = normalizeContainmentZoneMembers(
      members.map((member) => member.id)
    )
    const count = normalizedMembers.length

    if (count === 0) continue

    let riskSum = 0
    let anomalySum = 0
    let threatSum = 0
    let highAnomalyCount = 0

    for (const member of members) {
      const meta = (member.metadata as Meta) ?? {}
      const risk = Number(meta.riskScore ?? 0)
      const anomaly = Number(meta.anomalyScore ?? 0)
      const threat = Number(meta.threatScore ?? 0)

      riskSum += risk
      anomalySum += anomaly
      threatSum += threat

      if (anomaly > 0.7) {
        highAnomalyCount++
      }
    }

    const avgRisk = riskSum / count
    const avgAnomaly = anomalySum / count
    const avgThreat = threatSum / count
    const density = highAnomalyCount / count
    const severity = classifyZoneSeverity({
      avgRisk,
      avgAnomaly,
      avgThreat,
      density,
      memberCount: count,
    })

    zones.push({
      zoneId: clusterId,
      avgRisk,
      avgAnomaly,
      avgThreat,
      density,
      severity,
      members: normalizedMembers,
    })
  }

  return zones
}
