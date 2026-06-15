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

export type ControlCenterOperatorActivity = {
  id: string
  actor: string | null
  eventType: string
  message: string
  dossierId: string
  dossierReference: string
  dossierTitle: string
  fromState: string | null
  toState: string | null
  createdAt: string
  metadata?: Record<string, unknown> | null
}

export type ControlCenterTransitionExecution = {
  id: string
  dossierId: string
  dossierReference: string
  dossierTitle: string
  eventType: string
  actor: string | null
  fromState: string | null
  toState: string | null
  transitionKey: string | null
  generatedArtifacts: Array<{
    type?: string
    title?: string
    status?: string
    version?: string
  }>
  consequences: Array<{
    type?: string
    label?: string
    detail?: string
    severity?: string
  }>
  approvals: Array<{
    transitionKey?: string
    requiredRole?: string
    requiredCount?: number
    status?: string
  }>
  recordedAt: string
  createdAt: string
}

export type ControlCenterOperatorAuthority = {
  status: string
  detail: string
}

export type ControlCenterOperatorIdentity = {
  email: string
  roles: string[]
  permissionCount: number
  sessionActive?: boolean
  authority: {
    transitionAuthority: ControlCenterOperatorAuthority
    approvalAuthority: ControlCenterOperatorAuthority
    incidentAuthority: ControlCenterOperatorAuthority
    treasuryAuthority: ControlCenterOperatorAuthority
    artifactAuthority: ControlCenterOperatorAuthority
  }
  session: {
    active: boolean
    totalActions: number
    approvalsGranted: number
    transitionsExecuted: number
    artifactsGenerated: number
    incidentsResolved: number
    lastActionAt: string | null
    lastActionLabel: string | null
  }
}

export type ControlCenterTransitionRegistry = {
  ok: boolean
  issues: Array<{
    transitionKey: string
    severity: 'WARNING' | 'CRITICAL'
    message: string
  }>
  transitions: Array<{
    transitionKey: string
    fromState: string
    toState: string
    requiredApprovals: Array<{
      requiredRole: string
      requiredCount: number
    }>
    generatedArtifacts: Array<{
      type: string
      title: string
      status: string
      version: string
    }>
    consequences: Array<{
      type: string
      label: string
      detail: string
      severity: 'INFO' | 'WARNING' | 'CRITICAL'
    }>
  }>
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
    notes: string | null
  }>
  recentEvents: Array<{
    id: string
    eventType: string
    fromState: string | null
    toState: string | null
    message: string
    actor: string | null
    createdAt: string
    metadata?: Record<string, unknown> | null
  }>
}

type OperationalStateResponse = {
  ok: boolean
  state?: {
    incidents?: ControlCenterIncident[]
    intelligence?: ControlCenterIntelligenceSignal[]
    actions?: ControlCenterIncidentAction[]
    timeline?: ControlCenterTimelineEvent[]
    operatorActivity?: ControlCenterOperatorActivity[]
    transitionExecutionLedger?: ControlCenterTransitionExecution[]
    dossiers?: ControlCenterDossier[]
  }
}

type TransitionRegistryResponse = {
  ok: boolean
  registry?: ControlCenterTransitionRegistry
}

type OperatorIdentityResponse = {
  ok: boolean
  operator?: ControlCenterOperatorIdentity
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

  const [operatorActivity, setOperatorActivity] =
    useState<ControlCenterOperatorActivity[]>([])

  const [
    transitionExecutionLedger,
    setTransitionExecutionLedger,
  ] = useState<ControlCenterTransitionExecution[]>([])

  const [dossiers, setDossiers] =
    useState<ControlCenterDossier[]>([])

  const [transitionRegistry, setTransitionRegistry] =
    useState<ControlCenterTransitionRegistry | null>(null)

  const [operatorIdentity, setOperatorIdentity] =
    useState<ControlCenterOperatorIdentity | null>(null)

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

      setOperatorActivity(
        Array.isArray(state?.operatorActivity)
          ? state.operatorActivity
          : []
      )

      setTransitionExecutionLedger(
        Array.isArray(state?.transitionExecutionLedger)
          ? state.transitionExecutionLedger
          : []
      )

      setDossiers(
        Array.isArray(state?.dossiers)
          ? state.dossiers
          : []
      )

      const registryRes = await fetch(
        '/api/admin/control-center/transition-registry',
        {
          cache: 'no-store',
          credentials: 'include',
        }
      )

      const registryJson =
        (await registryRes.json()) as TransitionRegistryResponse

      setTransitionRegistry(
        registryJson.registry ?? null
      )

      const identityRes = await fetch(
        '/api/admin/control-center/operator-identity',
        {
          cache: 'no-store',
          credentials: 'include',
        }
      )

      const identityJson =
        (await identityRes.json()) as OperatorIdentityResponse

      setOperatorIdentity(
        identityJson.operator ?? null
      )
    } catch (err) {
      console.error(
        '[CONTROL_CENTER_OPERATIONAL_STATE_FAILED]',
        err
      )

      setIncidents([])
      setIntelligence([])
      setActions([])
      setTimeline([])
      setOperatorActivity([])
      setTransitionExecutionLedger([])
      setDossiers([])
      setTransitionRegistry(null)
      setOperatorIdentity(null)
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
    operatorActivity,
    transitionExecutionLedger,
    dossiers,
    transitionRegistry,
    operatorIdentity,
    loading,
    refreshOperationalState,
  }
}
