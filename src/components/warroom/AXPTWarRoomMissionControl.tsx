"use client"

import { useEffect, useState } from "react"
import { eventBus } from "@/engines/events/AXPTEventBus"

export default function AXPTWarRoomMissionControl() {

  const [events, setEvents] = useState<any[]>([])
  const [queue, setQueue] = useState<any[]>([])
  const [drift, setDrift] = useState(0)
  const [mode, setMode] = useState("NORMAL")

  useEffect(() => {

    const handler = (event: any) => {

      // ──────────────────────────────
      // GLOBAL EVENT STREAM
      // ──────────────────────────────
      setEvents(prev => [event, ...prev].slice(0, 200))

      // ──────────────────────────────
      // DERIVED STATE UPDATES
      // ──────────────────────────────
      switch (event.type) {

        case "RECONCILIATION_DRIFT_DETECTED":
          setDrift(event.payload.drift)
          break

        case "EXECUTION_STARTED":
          setMode("EXECUTING")
          break

        case "SYSTEM_QUARANTINE_TRIGGERED":
          setMode("LOCKDOWN")
          break

      }
    }

    eventBus.subscribe(handler)

    return () => {
      // NOTE: simple version (later upgrade to unsubscribe map)
    }

  }, [])

  return (
    <div className="w-full h-full text-white grid gap-4">

      {/* ──────────────────────────────
          HEADER CONTROL STRIP
      ────────────────────────────── */}
      <div className="border border-red-500/40 p-3 flex justify-between">

        <div>
          AXPT MISSION CONTROL
        </div>

        <div className="text-red-300">
          MODE: {mode}
        </div>

      </div>

      {/* ──────────────────────────────
          TOP METRICS
      ────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">

        <Metric label="Drift" value={drift} />
        <Metric label="Event Stream" value={events.length} />
        <Metric label="Queue" value={queue.length} />

      </div>

      {/* ──────────────────────────────
          MAIN CONTROL GRID
      ────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">

        {/* EXECUTION STREAM */}
        <Panel title="Execution Stream">
          {events.slice(0, 8).map((e, i) => (
            <div key={i} className="text-xs text-green-300">
              {e.type}
            </div>
          ))}
        </Panel>

        {/* CHAIN ACTIVITY */}
        <Panel title="Chain Activity">
          {events
            .filter(e => e.type.includes("ESCROW"))
            .slice(0, 8)
            .map((e, i) => (
              <div key={i} className="text-xs text-blue-300">
                {e.type}
              </div>
            ))}
        </Panel>

        {/* COGNITIVE DRIFT */}
        <Panel title="Cognitive Drift">
          <div className="text-2xl text-amber-300">
            {drift.toFixed(4)}
          </div>
        </Panel>

      </div>

      {/* ──────────────────────────────
          FULL EVENT TIMELINE
      ────────────────────────────── */}
      <div className="border p-3 h-64 overflow-y-scroll">

        <div className="text-slate-400 text-xs mb-2">
          EVENT TIMELINE (REAL-TIME)
        </div>

        {events.map((e, i) => (
          <div key={i} className="text-xs border-b border-white/10 py-1">
            <span className="text-green-400">{e.type}</span>
            <span className="text-slate-500 ml-2">
              {JSON.stringify(e.payload).slice(0, 80)}
            </span>
          </div>
        ))}

      </div>

    </div>
  )
}

/**
 * ──────────────────────────────
 * SMALL UI COMPONENTS
 * ──────────────────────────────
 */

function Panel({
  title,
  children,
}: any) {
  return (
    <div className="border border-white/10 p-3 bg-black/40">
      <div className="text-xs text-slate-400 mb-2">{title}</div>
      {children}
    </div>
  )
}

function Metric({
  label,
  value,
}: any) {
  return (
    <div className="border p-2">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-white text-sm">{String(value)}</div>
    </div>
  )
}