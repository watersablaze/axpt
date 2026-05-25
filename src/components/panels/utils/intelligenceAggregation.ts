import type { ControlCenterIncident }
  from '@/hooks/useControlCenterOperationalState'

export type AggregatedSignal = {
  id: string
  severity: 'NORMAL' | 'INFO' | 'WARNING' | 'CRITICAL'
  label: string
  detail: string
  streamType: string
  count: number
}

export function aggregateIncidentSignals(
  incidents: ControlCenterIncident[]
): AggregatedSignal[] {

  const treasuryIncidents =
    incidents.filter(
      (incident) =>
        incident.streamType === 'TREASURY'
    )

  const chainIncidents =
    incidents.filter(
      (incident) =>
        incident.streamType === 'CHAIN'
    )

  const signals: AggregatedSignal[] = []

  if (treasuryIncidents.length > 0) {
    signals.push({
      id: 'treasury-pressure',
      severity: 'CRITICAL',
      label: 'Treasury pressure active',
      detail:
        `${treasuryIncidents.length} unresolved treasury incident(s) require review.`,
      streamType: 'TREASURY',
      count: treasuryIncidents.length,
    })
  }

  if (chainIncidents.length > 0) {
    signals.push({
      id: 'chain-pressure',
      severity: 'WARNING',
      label: 'Chain degradation pressure detected',
      detail:
        `${chainIncidents.length} active chain degradation signal(s).`,
      streamType: 'CHAIN',
      count: chainIncidents.length,
    })
  }

  if (signals.length === 0) {
    signals.push({
      id: 'system-nominal',
      severity: 'NORMAL',
      label: 'No active degradation signals',
      detail:
        'Treasury nominal. Execution stable.',
      streamType: 'SYSTEM',
      count: 0,
    })
  }

  return signals
}