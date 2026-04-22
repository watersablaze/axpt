import { prisma } from '@/infrastructure/db/prisma'
import { collectPredictiveSignals, hashSignals } from '@/domains/predictive/predictiveSignals'
import {
  buildPredictiveRecommendations,
  scoreConfidence,
} from '@/domains/predictive/predictivePolicy'
import { planIntent } from '@/domains/intent/intentPlanner'
import { executeIntent } from '@/domains/intent/intentExecutor'
import { evaluateGovernor } from '@/domains/predictive/governor'
import { GOVERNOR_CONFIG } from '@/domains/predictive/governorConfig'

const COOLDOWN_MS = GOVERNOR_CONFIG.predictiveCooldownMs

export async function runPredictiveEngine() {
  const signals = await collectPredictiveSignals()
  const recommendations = buildPredictiveRecommendations(signals)
  const signalHash = hashSignals(signals)
  const confidence = scoreConfidence(signals)
  const now = Date.now()

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
    if (confidence < GOVERNOR_CONFIG.predictiveRecommendationConfidence) {
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
