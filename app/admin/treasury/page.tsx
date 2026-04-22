import TreasuryHealthPanel from '@/components/admin/treasury/TreasuryHealthPanel'
import MirrorPipelinePanel from '@/components/admin/treasury/MirrorPipelinePanel'
import TreasuryStatsPanel from '@/components/admin/treasury/TreasuryStatsPanel'
import AlertsPanel from '@/components/admin/treasury/AlertsPanel'
import ChainVerificationPanel from '@/components/admin/treasury/ChainVerificationPanel'
import ChainSyncPanel from '@/components/admin/treasury/ChainSyncPanel'
import ManualSyncPanel from '@/components/admin/treasury/ManualSyncPanel'
import MismatchExplorerPanel from '@/components/admin/treasury/MismatchExplorerPanel'
import SystemControlPanel from '@/components/admin/treasury/SystemControlPanel'
import TimelinePanel from '@/components/admin/treasury/TimelinePanel'
import PredictivePanel from '@/components/admin/treasury/PredictivePanel'
import PredictiveIntelligencePanel from '@/components/admin/treasury/PredictiveIntelligencePanel'
import AutonomousDecisionPanel from '@/components/admin/treasury/AutonomousDecisionPanel'
import DriftCorrectionPanel from '@/components/admin/treasury/DriftCorrectionPanel'
import DecisionExplanationPanel from '@/components/admin/treasury/DecisionExplanationPanel'
import SystemStatusStrip from '@/components/system/SystemStatusStrip'
import PanelSection from '@/components/system/PanelSection'

import {
  reconcileAllAssets,
  classifyReconciliation,
} from '@/domains/reconciliation/reconcileAssets'

import { verifyMirrorIntegrity } from '@/domains/mirror/chainVerification'
import { reconcileThreeLayer } from '@/domains/reconciliation/reconcileThreeLayer'
import { getSystemState } from '@/lib/system/pause'
import { selectBestIntent } from '@/domains/adaptive/intentSelector'
import { snapshotSystemState } from '@/domains/learning/systemSnapshot'

import { prisma } from '@/infrastructure/db/prisma'
import type { AssetReconciliationSnapshot } from '@/domains/reconciliation/reconcileAssets'
import AdaptiveIntentPanel from '@/components/admin/treasury/AdaptiveIntentPanel'
import LearningSummaryPanel from '@/components/admin/treasury/LearningSummaryPanel'

import ReplayComparisonPanel from '@/components/admin/treasury/ReplayComparisonPanel'
import ReplayDriftSummaryPanel from '@/components/admin/treasury/ReplayDriftSummaryPanel'
import { ReplaySelectionProvider } from '@/lib/context/ReplaySelectionContext'

async function getData() {
  const snapshots = await reconcileAllAssets()

  return snapshots.map((snapshot: AssetReconciliationSnapshot) => ({
    ...snapshot,
    status: classifyReconciliation(snapshot),
  }))
}

async function getChainVerification() {
  const [integrity, threeLayer] = await Promise.all([
    verifyMirrorIntegrity(),
    reconcileThreeLayer(),
  ])

  return { integrity, threeLayer }
}

async function getTimeline() {
  const events = await prisma.circuitEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return events.map((event) => ({
    id: event.id,
    type: event.type,
    severity: event.severity,
    message: event.message,
    createdAt: event.createdAt.toISOString(),
  }))
}

async function getDecisionLog() {
  const rows = await prisma.decisionExplanation.findMany({
    orderBy: { createdAt: 'desc' },
    take: 40,
  })

  return rows.map((row) => ({
    id: row.id,
    intent: row.intent,
    summary: row.summary,
    factors: Array.isArray(row.factors) ? (row.factors as string[]) : [],
    createdAt: row.createdAt.toISOString(),
  }))
}

async function getSyncStatus() {
  try {
    const [state, latestEvent] = await Promise.all([
      prisma.chainSyncState.findUnique({
        where: { id: 'mirror' },
      }),
      prisma.chainMirrorEvent.findFirst({
        orderBy: { blockNumber: 'desc' },
        select: {
          blockNumber: true,
          createdAt: true,
          chainId: true,
          network: true,
        },
      }),
    ])

    return {
      lastSyncedBlock: state?.lastBlock?.toString() ?? null,
      latestIndexedBlock: latestEvent?.blockNumber?.toString() ?? null,
      latestIndexedAt: latestEvent?.createdAt?.toISOString() ?? null,
      chainId: latestEvent?.chainId ?? 11155111,
      network: latestEvent?.network ?? 'sepolia',
    }

  } catch (err) {
    console.error('DB unavailable:', err)

    return {
      lastSyncedBlock: null,
      latestIndexedBlock: null,
      latestIndexedAt: null,
      chainId: 11155111,
      network: 'sepolia',
      degraded: true, // 👈 ADD THIS
    }
  }
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

async function getSystemStatus() {
  const res = await fetch(new URL('/api/admin/system/status', baseUrl), {
    cache: 'no-store',
  })
  const json = await res.json()
  return json.data
}

async function getPredictiveSummary() {
  const res = await fetch(new URL('/api/admin/predictive/summary', baseUrl), {
    cache: 'no-store',
  })
  const json = await res.json()
  return json.data
}

async function getAutonomousSummary() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? baseUrl}/api/admin/autonomous/summary`,
    { cache: 'no-store' }
  )

  const json = await res.json()
  return json.data
}

async function getDriftSummary() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? baseUrl}/api/admin/learning/drift-summary`,
    { cache: 'no-store' }
  )

  const json = await res.json()
  return json.data
}

type AdaptiveIntentSuggestion = {
  intent: string
  score: number
  reasoning: string[]
  assetCode?: string
  systemState: string
  weights: {
    successWeight: number
    impactWeight: number
    patternWeight: number
  }
}

async function getLearningData() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? baseUrl}/api/admin/learning/summary?intent=STABILIZE_SYSTEM`,
    { cache: 'no-store' }
  )
  const json = await res.json()
  return json.data
}

async function getAdaptiveIntentData(): Promise<AdaptiveIntentSuggestion[]> {
  const currentState = await snapshotSystemState()
  const intents = await selectBestIntent(currentState)

  return intents.map((intent) => ({
    intent: intent.intent,
    score: intent.score,
    reasoning: intent.reasoning,
    assetCode: intent.assetCode,
    systemState: intent.systemState,
    weights: intent.weights,
  }))
}

async function getReplayDriftSummary() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? baseUrl}/api/admin/explainability/replay-drift-summary`,
    { cache: 'no-store' }
  )
  const json = await res.json()
  return json.data
}

export default async function TreasuryPage() {
  const [
    data,
    chainData,
    syncStatus,
    timeline,
    decisionLog,
    systemStatus,
    systemState,
    predictiveSummary,
    autonomousSummary,
    driftSummary,
    learningData,
    adaptiveIntents,
    replayDriftSummary,
  ] = await Promise.all([
    getData(),
    getChainVerification(),
    getSyncStatus(),
    getTimeline(),
    getDecisionLog(),
    getSystemStatus(),
    getSystemState(),
    getPredictiveSummary(),
    getAutonomousSummary(),
    getDriftSummary(),
    getLearningData(),
    getAdaptiveIntentData(),
    getReplayDriftSummary(),
  ])

  return (
      <div className="space-y-6">
        <SystemStatusStrip data={systemStatus} />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <TreasuryHealthPanel data={data} />
            <TreasuryStatsPanel data={data} />
          </div>

          <div className="space-y-6">
            <MirrorPipelinePanel data={data} />
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <ChainVerificationPanel data={chainData} />
              <div className="space-y-6">
                <ChainSyncPanel data={syncStatus} />
                <ManualSyncPanel />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <SystemControlPanel
              state={{
                globalPaused: Boolean(systemState.globalPaused),
                pausedAssets: (systemState.pausedAssets ?? []) as string[],
                pausedLayers: (systemState.pausedLayers ?? []) as string[],
                reason: systemState.reason ?? null,
              }}
            />
            <AlertsPanel data={data} />
          </div>

          <div className="space-y-6">
            <PredictiveIntelligencePanel data={predictiveSummary} />
            <AdaptiveIntentPanel data={adaptiveIntents} />
          </div>
        </div>

        <PanelSection title="Intelligence & Autonomy">
          <div className="grid gap-6 lg:grid-cols-3">
            <PredictivePanel />
            <AutonomousDecisionPanel data={autonomousSummary} />
            <LearningSummaryPanel data={learningData} />
          </div>
        </PanelSection>

        <PanelSection title="Drift & Self-Correction" tone="warning">
          <DriftCorrectionPanel data={driftSummary} />
        </PanelSection>

        <PanelSection title="Diagnostics" collapsible>
          <MismatchExplorerPanel mismatches={chainData.threeLayer.mismatches} />
        </PanelSection>

        <PanelSection title="Operational Forensics" collapsible>
          <ReplaySelectionProvider>
            <div className="grid gap-6 lg:grid-cols-2">
              <DecisionExplanationPanel data={decisionLog} />
              <ReplayComparisonPanel />
            </div>

            <div className="mt-6">
              <ReplayDriftSummaryPanel data={replayDriftSummary} />
            </div>

            <div className="mt-6">
              <TimelinePanel events={timeline} />
            </div>
          </ReplaySelectionProvider>
        </PanelSection>
      </div>
  )
}
