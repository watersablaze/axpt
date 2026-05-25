import { aggregateIncidentSignals } from '@/components/panels/utils/intelligenceAggregation'
import type { ControlCenterIncident } from '@/hooks/useControlCenterOperationalState'

export function getOperationalSignals(
  incidents: ControlCenterIncident[]
) {
  return aggregateIncidentSignals(incidents)
}