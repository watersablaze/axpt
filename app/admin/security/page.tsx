import PanelSection from '@/components/system/PanelSection'

import SecurityStatusStrip from '@/components/admin/security/SecurityStatusStrip'
import PrincipalResolverPanel from '@/components/admin/security/PrincipalResolverPanel'
import RoleMatrixPanel from '@/components/admin/security/RoleMatrixPanel'
import LegacyAuthPanel from '@/components/admin/security/LegacyAuthPanel'
import SecurityReviewPanel from '@/components/admin/security/SecurityReviewPanel'
import SecurityTimelinePanel from '@/components/admin/security/SecurityTimelinePanel'
import TrustGraphPanel from '@/components/admin/security/TrustGraphPanel'
import SystemModePanel from '@/components/admin/security/SystemModePanel'
import SecurityIntegrityPanel from '@/components/admin/security/SecurityIntegrityPanel'

import { prisma } from '@/infrastructure/db/prisma'

import { getSecurityStatus } from '@/domains/auth/admin/getSecurityStatus'
import { getPrincipalDiagnostics } from '@/domains/auth/admin/getPrincipalDiagnostics'
import { getRoleDiagnostics } from '@/domains/auth/admin/getRoleDiagnostics'
import { getLegacyAuthDiagnostics } from '@/domains/auth/admin/getLegacyAuthDiagnostics'
import { getSystemSecurityState } from '@/domains/security/systemSecurityState'

type NormalizedMeta = {
  frozen: boolean
  quarantine: boolean
  trustScore: number | null
  riskScore: number | null
  anomalyScore: number
  clusterId: string | null
  threatScore: number
}

type SecurityUser = {
  id: string
  email: string | null
  label: string
  frozen: boolean
  quarantine: boolean
  trustScore: number | null
}

type TimelineEvent = {
  id: string
  type: string
  createdAt: string
  metadata: unknown
}

type TrustNode = {
  id: string
  label: string
  trustScore: number
  anomalyScore: number
  riskScore: number
  frozen: boolean
  quarantine: boolean
  clusterId: string | null
  threatScore: number
}

type TrustEdge = {
  source: string
  target: string
  weight: number
  suspicious: boolean
}

function normalizeMeta(meta: Record<string, unknown>): NormalizedMeta {
  return {
    frozen: Boolean(meta.frozen),
    quarantine: Boolean(meta.quarantine),
    trustScore: typeof meta.trustScore === 'number' ? meta.trustScore : null,
    riskScore: typeof meta.riskScore === 'number' ? meta.riskScore : null,
    anomalyScore:
      typeof meta.anomalyScore === 'number' ? meta.anomalyScore : 0,
    clusterId: typeof meta.clusterId === 'string' ? meta.clusterId : null,
    threatScore:
      typeof meta.threatScore === 'number' ? meta.threatScore : 0,
  }
}

function getUserMeta(metadata: unknown) {
  const raw =
    metadata && typeof metadata === 'object'
      ? (metadata as Record<string, unknown>)
      : {}

  return normalizeMeta(raw)
}

async function getSecurityUsers() {
  const users = await prisma.user.findMany({
    take: 50,
    select: {
      id: true,
      email: true,
      metadata: true,
    },
  })

  return users.map((user): SecurityUser => {
    const meta = getUserMeta(user.metadata)

    return {
      id: user.id,
      email: user.email,
      label: user.email ?? user.id,
      frozen: meta.frozen,
      quarantine: meta.quarantine,
      trustScore: meta.trustScore,
    }
  })
}

async function getSecurityTimeline() {
  const events = await prisma.eventLog.findMany({
    where: {
      type: {
        in: [
          'USER_FROZEN',
          'USER_UNFROZEN',
          'TRUST_RECOVERY',
          'APPEAL_REVIEW',
          'COORDINATED_ACTIVITY',
          'THREAT_PROPAGATION',
          'THREAT_FIELD_PERSISTED',
          'RISK_SNAPSHOT_PERSISTED',
          'SECURITY_RECOMPUTE_COMPLETE',
        ],
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return events.map(
    (event): TimelineEvent => ({
      id: event.id,
      type: event.type,
      createdAt: event.createdAt.toISOString(),
      metadata: event.metadata,
    })
  )
}

async function getTrustGraph() {
  const [users, edges] = await Promise.all([
    prisma.user.findMany({
      take: 200,
      select: {
        id: true,
        email: true,
        metadata: true,
      },
    }),
    prisma.userTrustEdge.findMany({
      take: 400,
      orderBy: [
        { transferCount: 'desc' },
        { failedCount: 'desc' },
        { trustScore: 'asc' },
      ],
      select: {
        fromUserId: true,
        toUserId: true,
        trustScore: true,
        transferCount: true,
        failedCount: true,
      },
    }),
  ])

  const nodes: TrustNode[] = users.map((user) => {
    const meta = getUserMeta(user.metadata)

    return {
      id: user.id,
      label: user.email ?? user.id,
      trustScore: meta.trustScore ?? 0,
      anomalyScore: meta.anomalyScore,
      riskScore: meta.riskScore ?? 0,
      frozen: meta.frozen,
      quarantine: meta.quarantine,
      clusterId: meta.clusterId,
      threatScore: meta.threatScore,
    }
  })

  const graphEdges: TrustEdge[] = edges
    .filter(
      (edge) =>
        edge.transferCount > 1 ||
        edge.failedCount > 0 ||
        edge.trustScore < 0
    )
    .map((edge) => ({
      source: edge.fromUserId,
      target: edge.toUserId,
      weight: Math.max(1, edge.transferCount),
      suspicious:
        edge.failedCount > 0 ||
        edge.trustScore < 0 ||
        edge.transferCount > 8,
    }))

  return {
    nodes,
    edges: graphEdges,
  }
}

async function getSecurityIntegrityUsers() {
  const users = await prisma.user.findMany({
    take: 50,
    select: {
      id: true,
      email: true,
      metadata: true,
    },
  })

  return users.map((user) => {
    const meta = getUserMeta(user.metadata)

    return {
      id: user.id,
      email: user.email,
      frozen: meta.frozen,
      quarantine: meta.quarantine,
      hasRiskScore: meta.riskScore !== null,
      hasTrustScore: meta.trustScore !== null,
      hasClusterId: meta.clusterId !== null,
    }
  })
}

export default async function SecurityPage() {
  const [
    status,
    principal,
    roles,
    legacy,
    users,
    timeline,
    graph,
    integrityUsers,
    system,
  ] = await Promise.all([
    getSecurityStatus(),
    getPrincipalDiagnostics(),
    getRoleDiagnostics(),
    getLegacyAuthDiagnostics(),
    getSecurityUsers(),
    getSecurityTimeline(),
    getTrustGraph(),
    getSecurityIntegrityUsers(),
    getSystemSecurityState(),
  ])

  return (
    <div className="space-y-6">
      <SecurityStatusStrip data={status} />

      <PanelSection title="Identity Resolution">
        <PrincipalResolverPanel data={principal} />
      </PanelSection>

      <PanelSection title="Authority & Roles">
        <RoleMatrixPanel data={roles} />
      </PanelSection>

      <PanelSection title="Legacy / Migration Diagnostics" tone="warning">
        <LegacyAuthPanel data={legacy} />
      </PanelSection>

      <PanelSection title="System Security State">
        <SystemModePanel
          data={{
            mode: system.pressure.mode,
            pressureScore: system.pressure.pressureScore,
            txVelocity: system.pressure.txVelocity,
            riskDensity: system.pressure.riskDensity,
            throttleMultiplier: system.throttle.multiplier,
            cooldownMs: system.throttle.cooldownMs,
            breakerLevel: system.breaker.level,
          }}
        />
      </PanelSection>

      <PanelSection title="Risk & Trust Intelligence">
        <div className="grid gap-6 lg:grid-cols-2">
          <SecurityReviewPanel users={users} />
          <SecurityTimelinePanel events={timeline} />
        </div>

        <div className="mt-6">
          <TrustGraphPanel graph={graph} />
        </div>
      </PanelSection>

      <PanelSection title="Security Integrity">
        <SecurityIntegrityPanel users={integrityUsers} />
      </PanelSection>
    </div>
  )
}