import type { EventRow } from './eventCognition'
import { EventTypes } from '@/core/events/types'

export type IncidentSeverity =
  | 'WARNING'
  | 'CRITICAL'

export type ActiveIncident = {
  id: string
  severity: IncidentSeverity
  title: string
  detail: string
  streamType: string
  openedAt?: string
  latestAt?: string
  eventCount: number
  acknowledged: boolean
}

export function deriveActiveIncidents(
  events: EventRow[]
): ActiveIncident[] {
  const incidents: ActiveIncident[] = []

  const escrowMismatches = events.filter(
    (event) => event.type === EventTypes.ESCROW_MISMATCH
  )

  if (escrowMismatches.length > 0) {
    incidents.push({
      id: `active-escrow-mismatch:${escrowMismatches[0]?.streamId ?? 'unknown'}`,
      severity: 'CRITICAL',
      title: 'Critical escrow mismatch unresolved',
      detail: `${escrowMismatches.length} escrow mismatch signal(s) require operator review.`,
      streamType: 'TREASURY',
      openedAt: escrowMismatches.at(-1)?.occurredAt,
      latestAt: escrowMismatches[0]?.occurredAt,
      eventCount: escrowMismatches.length,
      acknowledged: false,
    })
  }

  const chainLag = events.filter(
    (event) => event.type === EventTypes.CHAIN_SYNC_LAG
  )

  if (chainLag.length >= 5) {
    incidents.push({
      id: 'active-chain-degradation',
      severity: 'WARNING',
      title: 'Chain synchronization degradation active',
      detail: `${chainLag.length} chain lag events detected in the active window.`,
      streamType: 'CHAIN',
      openedAt: chainLag.at(-1)?.occurredAt,
      latestAt: chainLag[0]?.occurredAt,
      eventCount: chainLag.length,
      acknowledged: false,
    })
  }

  return incidents
}