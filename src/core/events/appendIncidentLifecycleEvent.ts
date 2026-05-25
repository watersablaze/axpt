import { appendDomainEvent } from '@/core/events/appendDomainEvent'
import { EventTypes } from '@/core/events/types'

type IncidentLifecycleAction =
  | typeof EventTypes.INCIDENT_ACKNOWLEDGED
  | typeof EventTypes.INCIDENT_RESOLVED
  | typeof EventTypes.INCIDENT_REOPENED

type Args = {
  incidentKey: string
  action: IncidentLifecycleAction
  streamType: string
  operatorEmail?: string | null
  operatorId?: string | null
  metadata?: Record<string, unknown>
}

export async function appendIncidentLifecycleEvent({
  incidentKey,
  action,
  streamType,
  operatorEmail,
  operatorId,
  metadata,
}: Args) {
  return appendDomainEvent({
    streamType,
    streamId: incidentKey,
    eventType: action,
    payload: {
      incidentKey,
      action,
      operatorEmail,
      operatorId,
    },
    metadata: {
      source: 'incident.lifecycle',
      incidentKey,
      operatorEmail,
      operatorId,
      ...(metadata ?? {}),
    },
  })
}