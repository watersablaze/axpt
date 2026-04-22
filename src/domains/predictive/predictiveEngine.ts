import { prisma } from '@/infrastructure/db/prisma'
import { collectPredictiveSignals, hashSignals } from './predictiveSignals'
import {
  buildPredictiveRecommendations,
  scoreConfidence,
} from './predictivePolicy'
import { planIntent } from '@/domains/intent/intentPlanner'
import { executeIntent } from '@/domains/intent/intentExecutor'
import { evaluateGovernor } from './governor'
import { GOVERNOR_CONFIG } from '@/domains/predictive/governorConfig'

const COOLDOWN_MS = GOVERNOR_CONFIG.predictiveCooldownMs
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

type PauseRequest = {
  globalPaused?: boolean
  pausedAssets?: string[]
  pausedLayers?: string[]
  reason: string
}

/**
 * Apply granular pauses based on signal type
 * Asset stress → pause asset only
 * Sync lag → pause MIRROR layer only
 * Critical breakage → full pause
 */
async function applyGranularPause(signals: any[]) {
  const assetStressSignals = signals.filter((s) => s.type === 'ASSET_STRESS')
  const syncLagSignals = signals.filter((s) => s.type === 'SYNC_LAG_RISING')
  const criticalSignals = signals.filter((s) => s.severity === 'CRITICAL')

  // Collect stressed assets
  const stressedAssets = [...new Set(assetStressSignals.map((s) => s.assetCode).filter(Boolean))]

  // Determine pause type
  if (criticalSignals.some((s) => s.type === 'DEAD_LETTER_PRESENT' || s.type === 'RECON_INSTABILITY')) {
    // Critical system failure → full pause
    await applyPause({
      globalPaused: true,
      reason: 'Critical predictive signal: ' + criticalSignals.map((s) => s.type).join(', '),
    })
  } else if (syncLagSignals.length > 0) {
    // Sync lag → pause MIRROR layer only
    await applyPause({
      pausedLayers: ['MIRROR'],
      reason: 'Predictive restriction: chain sync lag detected',
    })
  } else if (stressedAssets.length > 0) {
    // Asset stress → pause only those assets
    await applyPause({
      pausedAssets: stressedAssets,
      reason: `Predictive restriction: asset stress detected (${stressedAssets.join(', ')})`,
    })
  }
}

/**
 * Send pause request to treasury API
 */
async function applyPause(request: PauseRequest) {
  try {
    const res = await fetch(`${BASE_URL}/api/admin/treasury/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    if (!res.ok) {
      console.error(`Failed to apply pause: ${res.status} ${res.statusText}`)
      return
    }

    console.log(`✓ Applied pause: ${request.reason}`)
  } catch (err) {
    console.error('Failed to call pause API:', err)
  }
}

export async function runPredictiveEngine() {
  const signals = await collectPredictiveSignals()
  const recommendations = buildPredictiveRecommendations(signals)
  const signalHash = hashSignals(signals)
  const confidence = scoreConfidence(signals)
  const now = Date.now()

  // Apply granular pauses based on critical/warning signals
  await applyGranularPause(signals)

  for (const signal of signals) {
    await prisma.circuitEvent.create({
      data: {
        type: 'PREDICTIVE_SIGNAL',
        severity: signal.severity,
        message: signal.message,
        metadata: {
          signalType: signal.type,
          assetCode: signal.assetCode ?? null,
          value: signal.value ?? null,
          ...signal.metadata,
        },
      },
    })
  }

  for (const rec of recommendations) {
    await prisma.circuitEvent.create({
      data: {
        type: 'PREDICTIVE_RECOMMENDATION',
        severity: rec.autoRunnable ? 'INFO' : 'WARN',
        message: `Recommended intent: ${rec.intent} → ${rec.reason}`,
        metadata: {
          assetCode: rec.assetCode ?? null,
          autoRunnable: rec.autoRunnable,
          confidence,
          signalHash,
        },
      },
    })

    if (!rec.autoRunnable) continue
    if (confidence < 0.5) {
      await prisma.circuitEvent.create({
        data: {
          type: 'PREDICTIVE_EXECUTION',
          severity: 'INFO',
          message: `Skipped predictive intent: ${rec.intent} (confidence below threshold)`,
          metadata: {
            assetCode: rec.assetCode ?? null,
            confidence,
            signalHash,
            skipped: true,
            reason: 'LOW_CONFIDENCE',
          },
        },
      })
      continue
    }

    const lastExecution = await prisma.predictiveExecution.findFirst({
      where: {
        intent: rec.intent,
        assetCode: rec.assetCode ?? null,
      },
      orderBy: { executedAt: 'desc' },
    })

    if (lastExecution) {
      const elapsed = now - new Date(lastExecution.executedAt).getTime()
      const sameSignal = lastExecution.signalHash === signalHash

      if (sameSignal && elapsed < COOLDOWN_MS) {
        await prisma.circuitEvent.create({
          data: {
            type: 'PREDICTIVE_EXECUTION',
            severity: 'INFO',
            message: `Skipped predictive intent: ${rec.intent} (cooldown active)`,
            metadata: {
              assetCode: rec.assetCode ?? null,
              confidence,
              signalHash,
              skipped: true,
              reason: 'COOLDOWN',
              elapsedMs: elapsed,
            },
          },
        })
        continue
      }
    }

    const actions = await planIntent(rec.intent, {
      assets: rec.assetCode ? [rec.assetCode] : undefined,
    })

    const systemState = await evaluateGovernor(signals)

    if (systemState === 'PAUSED') {
      // Only allow safe stabilizing intents
      if (!['STABILIZE_SYSTEM', 'RESUME_SAFE'].includes(rec.intent)) {
        await prisma.circuitEvent.create({
          data: {
            type: 'PREDICTIVE_EXECUTION',
            severity: 'WARN',
            message: `Skipped predictive intent: ${rec.intent} (system paused, only safe intents allowed)`,
            metadata: {
              assetCode: rec.assetCode ?? null,
              confidence,
              signalHash,
              skipped: true,
              reason: 'SYSTEM_PAUSED',
              systemState,
            },
          },
        })
        continue
      }
    }

    await prisma.circuitEvent.create({
      data: {
        type: 'PREDICTIVE_EXECUTION',
        severity: 'INFO',
        message: `Executing predictive intent: ${rec.intent}`,
        metadata: {
          assetCode: rec.assetCode ?? null,
          actionCount: actions.length,
          confidence,
          signalHash,
        },
      },
    })

    await executeIntent(rec.intent, actions)

    await prisma.predictiveExecution.create({
      data: {
        intent: rec.intent,
        assetCode: rec.assetCode ?? null,
        confidence,
        success: true,
        signalHash,
      },
    })
  }

  return {
    signalCount: signals.length,
    recommendationCount: recommendations.length,
    autoExecutedCount: recommendations.filter((r) => r.autoRunnable).length,
    confidence,
    signalHash,
  }
}
