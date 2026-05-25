'use client'

import { useState } from 'react'
import type { ActiveIncident } from './utils/incidentCognition'
import { formatTime } from './utils/eventCognition'

type Props = {
  incidents: ActiveIncident[]
  onRefresh?: () => Promise<void>
}

function severityClass(severity: ActiveIncident['severity']) {
  return severity === 'CRITICAL'
    ? 'border-red-900 bg-red-950/30 text-red-300 shadow-[0_0_18px_rgba(127,29,29,0.22)]'
    : 'border-orange-900 bg-orange-950/30 text-orange-300 shadow-[0_0_14px_rgba(154,52,18,0.16)]'
}

export default function ActiveIncidentPanel({
  incidents,
  onRefresh,
}: Props) {

  const [acknowledged, setAcknowledged] =
    useState<Record<string, boolean>>({})

  const [resolved, setResolved] =
    useState<Record<string, boolean>>({})

  const activeIncidents = incidents

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Active Incidents
          </div>

          <h2 className="mt-1 text-lg font-medium text-white">
            Operational Pressure
          </h2>
        </div>

        <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
          {incidents.length} Active
        </div>
      </div>

      {activeIncidents.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 bg-black/30 p-3 text-sm text-neutral-400">
          No active incidents.
        </div>
      ) : (
        <div className="space-y-2">
          {incidents.map((incident) => {
            const isAcknowledged =
              acknowledged[incident.id] ??
              incident.acknowledged

            const isResolved =
              resolved[incident.id] ?? false

            return (
              <div
                key={incident.id}
                className={`rounded-lg border p-3 text-sm transition-opacity ${
                  isResolved ? 'opacity-40' : 'opacity-100'
                } ${severityClass(incident.severity)}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">
                    {incident.title}
                  </div>

                  <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                    {incident.streamType}
                  </div>
                </div>

                <div className="mt-1 text-xs text-neutral-400">
                  {incident.detail}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                <button
                type="button"
                disabled={isAcknowledged}
                onClick={async () => {
                    console.log('[INCIDENT_ACK_CLICK]', incident.id)

                    setAcknowledged((prev) => ({
                    ...prev,
                    [incident.id]: true,
                    }))

                    await fetch(
                    `/api/admin/control-center/incidents/${encodeURIComponent(incident.id)}`,
                    {
                        method: 'PATCH',
                        headers: {
                        'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                        action: 'ACKNOWLEDGE',
                        }),
                    }
                    )

                    await onRefresh?.()
                }}
                className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide transition-colors ${
                    isAcknowledged
                    ? 'cursor-not-allowed border-cyan-900 bg-cyan-950/30 text-cyan-400 opacity-60'
                    : 'border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-cyan-800 hover:text-cyan-300'
                }`}
                >
                {isAcknowledged ? 'Acknowledged' : 'Acknowledge'}
                </button>

                <button
                type="button"
                disabled={isResolved}
                onClick={async () => {
                    console.log('[INCIDENT_RESOLVE_CLICK]', incident.id)

                    setResolved((prev) => ({
                    ...prev,
                    [incident.id]: true,
                    }))

                    await fetch(
                    `/api/admin/control-center/incidents/${encodeURIComponent(incident.id)}`,
                    {
                        method: 'PATCH',
                        headers: {
                        'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                        action: 'RESOLVE',
                        }),
                    }
                    )

                    await onRefresh?.()
                }}
                className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide transition-colors ${
                    isResolved
                    ? 'cursor-not-allowed border-emerald-900 bg-emerald-950/30 text-emerald-400 opacity-60'
                    : 'border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-emerald-800 hover:text-emerald-300'
                }`}
                >
                {isResolved ? 'Resolved' : 'Resolve'}
                </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-3 text-[10px] uppercase tracking-wide text-neutral-500">
                  <span>Events: {incident.eventCount}</span>
                  <span>Opened: {formatTime(incident.openedAt)}</span>
                  <span>Latest: {formatTime(incident.latestAt)}</span>
                  <span>Ack: {isAcknowledged ? 'yes' : 'no'}</span>
                  <span>Resolved: {isResolved ? 'yes' : 'no'}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}