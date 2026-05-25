// src/components/panels/utils/eventCognition.ts

export type EventSeverity =
  | 'INFO'
  | 'SUCCESS'
  | 'WARN'
  | 'CRITICAL'

export type EventRow = {
  id?: string

  type: string
  streamType?: string
  streamId: string

  occurredAt?: string
  createdAt?: string

  metadata?: {
    severity?: EventSeverity
    source?: string
    [key: string]: unknown
  }
}

export type TimelineGroup = {
  type: string
  streamType?: string
  count: number
  firstOccurredAt?: string
  lastOccurredAt?: string
  events: EventRow[]
  severity: 'NORMAL' | 'ELEVATED' | 'SURGE'
}

export function getRecentPulse(events: EventRow[]) {
  const now = Date.now()

  const recent = events.filter((event) => {
    const time = event.occurredAt
      ? new Date(event.occurredAt).getTime()
      : 0

    return now - time <= 60_000
  })

  const critical = recent.filter(
    (event) => event.metadata?.severity === 'CRITICAL'
  ).length

  const warnings = recent.filter(
    (event) => event.metadata?.severity === 'WARN'
  ).length

  const byStreamType = recent.reduce<Record<string, number>>(
    (acc, event) => {
      const key = event.streamType ?? 'SYSTEM'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    },
    {}
  )

  return {
    total: recent.length,
    critical,
    warnings,
    byStreamType,
  }
}

export function groupTimelineEvents(
  events: EventRow[]
): TimelineGroup[] {
  const groups: TimelineGroup[] = []

  for (const event of events) {
    const last = groups[groups.length - 1]

    const eventTime = event.occurredAt
      ? new Date(event.occurredAt).getTime()
      : 0

    const lastTime = last?.lastOccurredAt
      ? new Date(last.lastOccurredAt).getTime()
      : 0

    const withinWindow =
      Math.abs(eventTime - lastTime) <= 20_000

    const sameType = last?.type === event.type
    const sameStream = last?.streamType === event.streamType

    if (
      last &&
      sameType &&
      sameStream &&
      withinWindow
    ) {
      last.count += 1
      last.lastOccurredAt = event.occurredAt
      last.events.push(event)

      if (last.count >= 8) {
        last.severity = 'SURGE'
      } else if (last.count >= 4) {
        last.severity = 'ELEVATED'
      } else {
        last.severity = 'NORMAL'
      }

      continue
    }

    groups.push({
      type: event.type,
      streamType: event.streamType,
      count: 1,
      firstOccurredAt: event.occurredAt,
      lastOccurredAt: event.occurredAt,
      events: [event],
      severity: 'NORMAL',
    })
  }

  return groups
}

export function formatTime(value?: string) {
  if (!value) return '—'

  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function getBurstWindowLabel(group: TimelineGroup) {
  if (group.count <= 1) return null

  const first = group.firstOccurredAt
    ? new Date(group.firstOccurredAt).getTime()
    : 0

  const last = group.lastOccurredAt
    ? new Date(group.lastOccurredAt).getTime()
    : 0

  const seconds = Math.max(
    0,
    Math.round(Math.abs(last - first) / 1000)
  )

  return `Burst window: ${seconds}s`
}

export function readMetaString(
  metadata: EventRow['metadata'],
  key: string
): string | null {
  const value = metadata?.[key]

  if (
    typeof value === 'string' ||
    typeof value === 'number'
  ) {
    return String(value)
  }

  return null
}