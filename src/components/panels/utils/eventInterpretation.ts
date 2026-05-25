import { EventTypes } from '@/core/events/types'

export const EVENT_INTERPRETATIONS = {
  [EventTypes.ESCROW_MISMATCH]: 'Escrow mismatch detected',
  [EventTypes.TREASURY_INFLOW]: 'Treasury inflow recorded',
  [EventTypes.ACCOUNT_LOCKED]: 'Account access restricted',
  [EventTypes.GOVERNANCE_OVERRIDE]: 'Governance override executed',
  [EventTypes.CHAIN_SYNC_LAG]: 'Chain synchronization delay detected',
  [EventTypes.INCIDENT_ACKNOWLEDGED]: 'Incident acknowledged by operator',
  [EventTypes.INCIDENT_RESOLVED]: 'Incident resolved by operator',
  [EventTypes.INCIDENT_REOPENED]: 'Incident reopened by operator',
} as const

export function interpretEventType(type: string) {
  return (
    EVENT_INTERPRETATIONS[
      type as keyof typeof EVENT_INTERPRETATIONS
    ] ?? type
  )
}