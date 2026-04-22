"use client"

import { useEffect, useState } from "react"
import EventItem from "./EventItem"
import { getPhase } from "@/lib/cases/eventPhases"
import { deriveCaseStage } from "@/lib/cases/phaseEngine"

type Event = {
  id: string
  type: string
  timestamp: string
  payload?: any
}

export default function OperatorTimeline({ caseId }: { caseId: string }) {

  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    fetch(`/api/cases/${caseId}/events`)
      .then(r => r.json())
      .then(setEvents)
  }, [caseId])

  const grouped = events.reduce((acc, e) => {
    const phase = getPhase(e.type)

    if (!acc[phase]) acc[phase] = []
    acc[phase].push(e)

    return acc
  }, {} as Record<string, Event[]>)

  const stage = deriveCaseStage(events)

  return (
    <div className="border border-neutral-800 rounded-lg p-4 space-y-6">

      {/* 🔥 HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          Operator Timeline
        </h2>

        <div className="text-xs px-2 py-1 rounded bg-neutral-800">
          Stage: {stage}
        </div>
      </div>

      {events.length === 0 && (
        <div className="text-sm text-neutral-500">
          No events yet
        </div>
      )}

      {/* 🔥 PHASED TIMELINE */}
      <div className="space-y-6">

        {Object.entries(grouped).map(([phase, phaseEvents]) => {

          const status = getPhaseStatus(phaseEvents)

          return (
            <div key={phase}>

              <div className="flex justify-between items-center mb-2">

                <span className="text-xs uppercase text-neutral-500">
                  {phase}
                </span>

                <span className="text-xs text-neutral-400">
                  {status}
                </span>

              </div>

              <div className="space-y-2 border-l border-neutral-800 pl-4">
                {phaseEvents.map(e => (
                  <EventItem
                    key={e.id}
                    type={e.type}
                    timestamp={e.timestamp}
                    payload={e.payload}
                  />
                ))}
              </div>

            </div>
          )
        })}

      </div>

    </div>
  )
}

/* 🔥 PHASE STATUS ENGINE */
function getPhaseStatus(events: Event[]) {

  if (events.some(e => e.type.includes("MISMATCH"))) {
    return "ERROR"
  }

  if (events.some(e => e.type.includes("PENDING"))) {
    return "PENDING"
  }

  return "COMPLETE"
}