// app/api/admin/global-awareness/route.ts

import { NextResponse } from "next/server"
import { computeEscalation } from "@/core/automation/escalation"
import { computeMetaAwareness } from "@/core/automation/metaAwareness"

type Alert = {
  level: "INFO" | "WARNING" | "CRITICAL"
  message: string
}

export async function GET() {
  try {
    const awarenessRes = await fetch(
      "http://localhost:3000/api/admin/system-awareness",
      { cache: "no-store" }
    )

    if (!awarenessRes.ok) {
      throw new Error(
        `System awareness request failed with status ${awarenessRes.status}`
      )
    }

    const awarenessJson = await awarenessRes.json()
    const items = awarenessJson.items || []
    const meta = computeMetaAwareness(items)

    let totalSeverity = 0
    const alertPool: Alert[] = []
    let disputeCount = 0
    let lowConfidence = 0
    let distrustSignals = 0

    items.forEach((c: any) => {
      const alerts: Alert[] = c.alerts || []
      const confidence = c.council?.confidence ?? 0

      alerts.forEach((a) => {
        alertPool.push(a)

        if (a.level === "CRITICAL") totalSeverity += 0.4
        else if (a.level === "WARNING") totalSeverity += 0.2
        else totalSeverity += 0.05
      })

      if (c.status === "ESCROW_DISPUTED") {
        disputeCount++
        totalSeverity += 0.5
      }

      if (confidence < 0.6) {
        lowConfidence++
        totalSeverity += 0.25
      }

      if (confidence < 0.5) {
        distrustSignals++
        totalSeverity += 0.3
      }
    })

    const severity = Math.min(totalSeverity / 5, 1)

    let dominantMode =
      distrustSignals > 2
        ? "SYSTEM_DISTRUST"
        : disputeCount > 0
        ? "DISPUTE_DOMINANT"
        : lowConfidence > 2
        ? "UNSTABLE_COUNCIL"
        : alertPool.length > 5
        ? "HIGH_SIGNAL_NOISE"
        : "STABLE"

    const requiresHumanAttention =
      severity > 0.65 || disputeCount > 0 || distrustSignals > 2

    const escalation = computeEscalation({
      severity,
      dominantMode,
      requiresHumanAttention,
      metrics: {
        disputeCount,
        lowConfidence,
        totalAlerts: alertPool.length,
      },
    })

    const topAlerts = alertPool
      .sort((a, b) => {
        const weight = { CRITICAL: 3, WARNING: 2, INFO: 1 }
        return weight[b.level] - weight[a.level]
      })
      .slice(0, 5)

    return NextResponse.json({
      ok: true,
      degraded: false,
      severity,
      dominantMode,
      requiresHumanAttention,
      escalation,
      meta,
      metrics: {
        disputeCount,
        lowConfidence,
        distrustSignals,
        totalAlerts: alertPool.length,
      },
      topAlerts,
    })
  } catch (err: any) {
    console.error("GLOBAL_AWARENESS_ERROR:", err)

    return NextResponse.json({
      ok: false,
      degraded: true,
      severity: 0,
      dominantMode: "DEGRADED_AWARENESS",
      requiresHumanAttention: true,
      escalation: {
        level: "DEGRADED",
        effects: {
          allowAutomation: false,
          requireHuman: true,
          slowDecisions: true,
        },
      },
      meta: {
        metaState: "AWARENESS_DEGRADED",
        avgConfidence: 0,
      },
      metrics: {
        disputeCount: 0,
        lowConfidence: 0,
        distrustSignals: 0,
        totalAlerts: 1,
      },
      topAlerts: [
        {
          level: "WARNING",
          message: err.message || "Global awareness degraded",
        },
      ],
      error: err.message || "UNKNOWN_ERROR",
    })
  }
}