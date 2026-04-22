"use client"

import { useAwareness, type AwarenessOperator } from "../../../lib/realtime/AwarenessProvider"
import PanelWrapper from "@/components/admin/system/PanelWrapper"
import SystemTopologyPanel from "@/components/admin/system/SystemTopologyPanel"

export default function DecisionSurface() {
  const { items, global } = useAwareness()

  const isCritical = global?.escalation?.level === "CRITICAL"

  const primary = items.length
    ? [...items].sort((a, b) => b.priorityScore - a.priorityScore)[0]
    : null

  if (!primary) {
    return (
      <PanelWrapper title="Decision Core" isEmpty>
        No awareness cases available.
      </PanelWrapper>
    )
  }

  const confidence = primary.council?.confidence ?? 0
  const networkConfidence = global.meta.avgConfidence ?? 0
  const breakdown = primary.council?.breakdown ?? {
    APPROVE: 0,
    DELAY: 0,
    OVERRIDE: 0,
  }

  const total =
    breakdown.APPROVE + breakdown.DELAY + breakdown.OVERRIDE || 1

  const approvePct = Math.round((breakdown.APPROVE / total) * 100)
  const delayPct = Math.round((breakdown.DELAY / total) * 100)
  const overridePct = Math.round((breakdown.OVERRIDE / total) * 100)

  const dominant = (primary.operators || [])
    .map((op: AwarenessOperator) => {
      const h = primary.hierarchy?.find((x) => x.operatorId === op.operatorId)
      const m = primary.momentum?.find((x) => x.operatorId === op.operatorId)

      return {
        ...op,
        score: (h?.power ?? 0) + (m?.velocity ?? 0),
      }
    })
    .sort((a, b) => b.score - a.score)[0]

  return (
    <PanelWrapper title="Decision Core" critical={isCritical}>
      <div className="space-y-4"> 

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <div className="text-base font-semibold">
              Case {primary.caseId.slice(0, 8)}
            </div>
            <div className="text-xs text-emerald-400">
              {primary.status}
            </div>
          </div>

          <div className="text-right text-xs space-y-1">
            <div>
              Case Confidence {(confidence * 100).toFixed(0)}%
            </div>
            <div className="text-neutral-500">
              Network Avg {(networkConfidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* ESCALATION STRIP */}
        {global?.escalation && (
          <div
            className={`px-3 py-2 text-[11px] border rounded flex flex-wrap gap-2 justify-between ${
              isCritical
                ? "border-red-500 text-red-400 bg-red-500/10 animate-pulse"
                : global.escalation.level === "DEGRADED"
                ? "border-yellow-500 text-yellow-400 bg-yellow-500/10"
                : "border-emerald-500 text-emerald-400 bg-emerald-500/10"
            }`}
          >
            <span>System Escalation: {global.escalation.level}</span>
            <span className="text-neutral-300">
              Meta {global.meta.metaState}
            </span>
            {global.requiresHumanAttention && <span>HUMAN REQUIRED</span>}
          </div>
        )}


        {/* CORE GRID */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">

          {/* LEFT — DECISION LOGIC */}
          <div className="space-y-3 xl:col-span-5">

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="border p-2 rounded text-emerald-400">
                APPROVE {approvePct}%
              </div>
              <div className="border p-2 rounded text-yellow-400">
                DELAY {delayPct}%
              </div>
              <div className="border p-2 rounded text-red-400">
                OVERRIDE {overridePct}%
              </div>
            </div>

            {dominant && (
              <div className="border border-cyan-500/40 px-3 py-2 rounded text-xs">
                Dominant Actor: {dominant.name}
              </div>
            )}

              {/* ALERTS */}
              {primary.alerts?.map((a, i) => (
                <div
                  key={i}
                  className={`text-[11px] px-3 py-2 border rounded ${
                    a.level === "CRITICAL"
                      ? "border-red-500 text-red-400"
                      : a.level === "WARNING"
                      ? "border-yellow-500 text-yellow-400"
                      : "border-blue-500 text-blue-400"
                  }`}
                >
                  {a.message}
                </div>
              ))}

            </div>

          {/* RIGHT — TOPOLOGY (DOMINANT) */}
          <div className="xl:col-span-7">
            <SystemTopologyPanel
              caseId={primary.caseId}
              operators={primary.operators}
              hierarchy={primary.hierarchy}
              momentum={primary.momentum}
              alerts={primary.alerts}
              dominant={dominant?.operatorId}
              decision={primary.council?.finalDecision}
              confidence={confidence}
            />
          </div>

        </div>
      </div>
      
    </PanelWrapper>
  )
}
