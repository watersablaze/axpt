import { setSystemPause } from './pause'
import { sendAlert } from './alert'

type CircuitInput = {
  mismatches: any[]
  syncLagSeconds?: number | null
}

export async function evaluateCircuitBreaker(input: CircuitInput) {
  const { mismatches, syncLagSeconds } = input

  // ---- RULE 1: Critical mismatch → pause asset ----
  const critical = mismatches.filter(
    (m) =>
      m.type === 'CONFIRMED_JOB_MISSING_CHAIN_EVENT' ||
      m.type === 'CHAIN_EVENT_MISSING_MIRROR_JOB'
  )

  if (critical.length > 0) {
    const affectedAssets = [
      ...new Set(critical.map((m) => m.assetCode).filter(Boolean)),
    ]

    await sendAlert(
      `CIRCUIT BREAKER: Critical mismatch → ${affectedAssets.join(', ')}`,
      'CRITICAL',
      {
        code: 'CRITICAL_MISMATCH',
        title: 'Critical Mismatch Detected',
        fingerprint: 'CRITICAL_MISMATCH',
        throttleMs: 300_000,
      }

    )

    await setSystemPause({
      pausedAssets: affectedAssets,
      reason: 'Critical reconciliation failure'
    })

    return
  }

  // ---- RULE 2: Too many mismatches → pause transfers ----
  if (mismatches.length > 5) {
    await sendAlert(
      `CIRCUIT BREAKER: Excess mismatches (${mismatches.length})`,
      'WARN'
    )

    await setSystemPause({
      pausedLayers: ['TRANSFER'],
      reason: 'Mismatch threshold exceeded'
    })

    return
  }

  // ---- RULE 3: Sync lag → pause mirror ----
  if (syncLagSeconds && syncLagSeconds > 60) {
    await sendAlert(
      `CIRCUIT BREAKER: Sync lag ${syncLagSeconds}s`,
      'WARN'
    )

    await setSystemPause({
      pausedLayers: ['MIRROR'],
      reason: 'Chain sync lag detected'
    })

    return
  }
}