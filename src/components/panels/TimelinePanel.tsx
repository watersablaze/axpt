'use client'

import { useEffect, useState } from 'react'
import {
  interpretEventType,
} from './utils/eventInterpretation'
import {
  formatTime,
  getBurstWindowLabel,
  getRecentPulse,
  groupTimelineEvents,
  readMetaString,
  type EventRow,
  type EventSeverity,
} from './utils/eventCognition'
import { json } from 'zod/v4/mini';

type Props = {
  timestamp?: number
}

function severityTone(
  severity?: EventSeverity
) {
  switch (severity) {
    case 'CRITICAL':
      return {
        badge:
          'border-red-900 bg-red-950/40 text-red-300',
        text: 'text-red-300',
      }

    case 'WARN':
      return {
        badge:
          'border-orange-900 bg-orange-950/40 text-orange-300',
        text: 'text-orange-300',
      }

    case 'SUCCESS':
      return {
        badge:
          'border-green-900 bg-green-950/30 text-green-300',
        text: 'text-green-300',
      }

    default:
      return {
        badge:
          'border-neutral-800 bg-neutral-900 text-neutral-300',
        text: 'text-neutral-300',
      }
  }
}

function familyTone(
  streamType?: string
) {
  switch (streamType) {
    case 'TREASURY':
      return 'text-emerald-400'

    case 'CASE':
      return 'text-cyan-400'

    case 'SECURITY':
      return 'text-red-400'

    case 'GOVERNANCE':
      return 'text-violet-400'

    case 'CHAIN':
      return 'text-yellow-400'

    default:
      return 'text-neutral-400'
  }
}

    export default function TimelinePanel({
      timestamp,
    }: Props) {
          const [events, setEvents] =
            useState<EventRow[]>([])

          useEffect(() => {
    async function loadInitialEvents() {
      try {
    const res = await fetch('/api/admin/events', {
      cache: 'no-store',
      credentials: 'include',
    })

    const json = await res.json()

      if (Array.isArray(json?.events)) {
          setEvents(json.events)
          }
      } catch (err) {
          console.error('[TIMELINE_INITIAL_LOAD_FAILED]', err)
      }
    }

    console.log('[TIMELINE_INITIAL_EVENTS]', json)

        loadInitialEvents()
    const stream = new EventSource(
      '/api/admin/events/stream'
    )

    stream.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)

        setEvents((prev) => [
          payload,
          ...prev,
        ].slice(0, 40))
      } catch (err) {
        console.error(
          '[TIMELINE_STREAM_PARSE_FAILED]',
          err
        )
      }
    }

    stream.onerror = (err) => {
      console.error(
        '[TIMELINE_STREAM_ERROR]',
        err
      )
    }

    return () => {
      stream.close()
    }
  }, [])

  const pulse = getRecentPulse(events)

  const groupedEvents = groupTimelineEvents(events)

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-white">
          Timeline
        </h2>

        <div className="text-xs text-neutral-500">
          {timestamp
            ? new Date(timestamp).toLocaleTimeString()
            : '—'}
        </div>
      </div>

    <div className="mb-4 rounded-lg border border-neutral-800 bg-black/30 p-3">
      <div className="mb-2 text-xs uppercase tracking-wide text-neutral-500">
        Last 60 Seconds
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        <span className="text-neutral-300">
          Events: {pulse.total}
        </span>

        <span className="text-red-300">
          Critical: {pulse.critical}
        </span>

        <span className="text-orange-300">
          Warnings: {pulse.warnings}
        </span>

        {Object.entries(pulse.byStreamType).map(([key, count]) => (
          <span key={key} className="text-cyan-300">
            {key}: {Number(count)}
          </span>
        ))}
      </div>
    </div>

      <div className="space-y-3 max-h-[420px] overflow-auto">
      {groupedEvents.length > 0 ? (
        groupedEvents.map((group, index) => {
          const event =
            group.events[group.events.length - 1]
            const severity =
              event.metadata?.severity ??
              'INFO'

            const tone =
              severityTone(severity)

              const interpretation =
                interpretEventType(event.type)

                const amount = readMetaString(event.metadata, 'amount')
                const asset = readMetaString(event.metadata, 'asset')
                const counterparty = readMetaString(event.metadata, 'counterparty')
                const confidence = readMetaString(event.metadata, 'confidence')
                const operator = readMetaString(event.metadata, 'operator')

                const burstWindowLabel = getBurstWindowLabel(group)

            return (
              <div
                key={`${group.type}-${group.streamType ?? 'SYSTEM'}-${group.lastOccurredAt ?? index}`}
                className="border-b border-neutral-800 pb-3"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-wide ${tone.badge}`}
                  >
                    {severity}
                  </span>

                  <span
                    className={`text-xs uppercase tracking-wide ${familyTone(event.streamType)}`}
                  >
                    {event.streamType ??
                      'SYSTEM'}
                  </span>
                </div>

              <div
                className={`text-sm font-medium ${tone.text}`}
              >
                {interpretation}
                {group.count > 1 ? (
                  <span className="ml-2 text-xs text-neutral-400">
                    × {group.count}
                  </span>
                ) : null}
              </div>

                {group.severity === 'SURGE' ? (
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-red-400">
                    Surge activity detected
                  </div>
                ) : null}

                {group.severity === 'ELEVATED' ? (
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-orange-400">
                    Elevated activity
                  </div>
                ) : null}

                {burstWindowLabel ? (
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-neutral-500">
                    {burstWindowLabel}
                  </div>
                ) : null}

                {group.count > 1 ? (
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-neutral-500">
                    Latest: {formatTime(group.lastOccurredAt)}
                  </div>
                ) : null}

                <div className="mt-1 text-[11px] uppercase tracking-wide text-neutral-600">
                {event.type}
                </div>

                {amount ? (
                <div className="mt-2 text-xs text-emerald-300">
                    +{amount} {asset ?? ''}
                </div>
                ) : null}

                {counterparty ? (
                <div className="mt-1 text-xs text-neutral-400">
                    Counterparty: {counterparty}
                </div>
                ) : null}

                {confidence ? (
                <div className="mt-1 text-xs text-cyan-400">
                    Confidence: {confidence}
                </div>
                ) : null}

                {operator ? (
                <div className="mt-1 text-xs text-violet-400">
                    Operator: {operator}
                </div>
                ) : null}

                <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-neutral-600">
                <span>
                    {event.occurredAt
                    ? new Date(
                        event.occurredAt
                        ).toLocaleString()
                    : '—'}
                </span>

                {event.metadata?.source ? (
                    <span>
                    source:{' '}
                    {String(
                        event.metadata.source
                    )}
                    </span>
                ) : null}
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-sm text-neutral-500">
            Waiting for institutional events...
          </div>
        )}
      </div>
    </div>
  )
}