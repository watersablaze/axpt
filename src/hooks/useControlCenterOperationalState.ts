'use client'

import { useCallback, useEffect, useState } from 'react'

export type ControlCenterIncident = {
  id: string
  severity: 'WARNING' | 'CRITICAL'
  title: string
  detail: string
  streamType: string
  openedAt?: string
  latestAt?: string
  eventCount: number
  acknowledged: boolean
  resolved?: boolean
}

export type ControlCenterIntelligenceSignal = {
  id: string
  severity: 'NORMAL' | 'INFO' | 'WARNING' | 'CRITICAL'
  label: string
  detail?: string
  streamType?: string
  count?: number
}

export type ControlCenterIncidentAction = {
  id: string
  incidentKey: string
  action: string
  operatorEmail: string | null
  operatorId: string | null
  note: string | null
  createdAt: string
}

export type ControlCenterTimelineEvent = {
  id: string
  type: string
  streamType: string
  streamId: string
  occurredAt: string
  createdAt: string
  metadata?: Record<string, unknown>
}

export type ControlCenterDossier = {
  id: string
  reference: string
  title: string
  state: string
  nextStates?: string[]
 artifactGate?: {
    passed: boolean
    blockingReason?: string
    checks: Array<{
      id: string
      label: string
      passed: boolean
      detail?: string
    }>
  }

  approvalRequirements?: Array<{
    id: string
    transitionKey: string
    requiredRole: string
    requiredCount: number
    status: string
    createdAt: string
    updatedAt: string
    approvals: Array<{
      id: string
      operatorEmail: string
      operatorId: string | null
      roleKey: string
      decision: string
      note: string | null
      createdAt: string
    }>
  }>
  commodity: string | null
  origin: string | null
  quantityKg: string | null
  refinery: string | null
  settlement: string | null
  parties: Array<{
    id: string
    role: string
    legalName: string
    country: string | null
  }>
  instruments: Array<{
    id: string
    type: string
    status: string
    version: string
    title: string
  }>
  recentEvents: Array<{
    id: string
    eventType: string
    fromState: string | null
    toState: string | null
    message: string
    actor: string | null
    createdAt: string
  }>
}

type OperationalStateResponse = {
  ok: boolean
  state?: {
    incidents?: ControlCenterIncident[]
    intelligence?: ControlCenterIntelligenceSignal[]
    actions?: ControlCenterIncidentAction[]
    timeline?: ControlCenterTimelineEvent[]
    dossiers?: ControlCenterDossier[]
  }
}

export function useControlCenterOperationalState() {
  const [incidents, setIncidents] =
    useState<ControlCenterIncident[]>([])

  const [intelligence, setIntelligence] =
    useState<ControlCenterIntelligenceSignal[]>([])

  const [actions, setActions] =
    useState<ControlCenterIncidentAction[]>([])

  const [timeline, setTimeline] =
    useState<ControlCenterTimelineEvent[]>([])

  const [dossiers, setDossiers] =
    useState<ControlCenterDossier[]>([])

  const [loading, setLoading] = useState(true)

  const refreshOperationalState = useCallback(async () => {
    try {
      const res = await fetch(
        '/api/admin/control-center/operational-state',
        {
          cache: 'no-store',
          credentials: 'include',
        }
      )

      const json =
        (await res.json()) as OperationalStateResponse

      const state = json.state

      setIncidents(
        Array.isArray(state?.incidents)
          ? state.incidents
          : []
      )

      setIntelligence(
        Array.isArray(state?.intelligence)
          ? state.intelligence
          : []
      )

      setActions(
        Array.isArray(state?.actions)
          ? state.actions
          : []
      )

      setTimeline(
        Array.isArray(state?.timeline)
          ? state.timeline
          : []
      )

      setDossiers(
        Array.isArray(state?.dossiers)
          ? state.dossiers
          : []
      )
    } catch (err) {
      console.error(
        '[CONTROL_CENTER_OPERATIONAL_STATE_FAILED]',
        err
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshOperationalState()

    const interval = window.setInterval(
      refreshOperationalState,
      5000
    )

    return () => window.clearInterval(interval)
  }, [refreshOperationalState])

  return {
    incidents,
    intelligence,
    actions,
    timeline,
    dossiers,
    loading,
    refreshOperationalState,
  }
}