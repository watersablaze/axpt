"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

type OperatorDecision = "APPROVE" | "DELAY" | "OVERRIDE"

const STALE_AFTER_MS = 15_000

const POLL_INTERVALS = {
  CRITICAL: 5000,
  DEGRADED: 7000,
  STABLE: 10000,
} as const

// =========================
// TYPES
// =========================

export type AwarenessAlert = {
  level: string
  message: string
}

export type AwarenessOperator = {
  operatorId: string
  name?: string
  role?: string
  decision?: string
  [key: string]: unknown
}

export type SystemAwarenessItem = {
  caseId: string
  status: string
  priorityScore: number
  nextAction: string
  operators: AwarenessOperator[]
  council?: {
    finalDecision: OperatorDecision | null
    confidence: number
    breakdown?: Record<string, number> // ✅ RESTORED
  }
  hierarchy: any[]
  momentum: any[]
  alerts: AwarenessAlert[]
}

export type GlobalAwareness = {
  severity: number
  dominantMode: string
  requiresHumanAttention: boolean
  escalation: {
    level: "STABLE" | "DEGRADED" | "CRITICAL"
    effects: {
      allowAutomation: boolean
      requireHuman: boolean
      slowDecisions: boolean
    }
  }
  metrics: {
    disputeCount: number
    lowConfidence: number
    totalAlerts: number
  }
  topAlerts: AwarenessAlert[]
  meta: {
    metaState: string
    avgConfidence: number | null
  }
  degraded: boolean
  issues: string[] // ✅ ALWAYS EXISTS NOW
}

export type DomainEvent = {
  type: string
  createdAt: string
  streamId?: string
  payload?: Record<string, unknown>
}

export type NextAction = {
  caseId: string
  message: string
  priority: "LOW" | "MEDIUM" | "HIGH"
}

export type Bottlenecks = {
  waitingSignature: number
  waitingArtifact: number
  escrowPending: number
}

export type CommandIntelligence = {
  instabilityScore: number
  throughputPressure: number
  systemState: string
}

export type CommandSnapshot = {
  events: DomainEvent[]
  activeCases: number
  pendingGates: number
  lockedEscrows: number
  alerts: number
  nextActions: NextAction[]
  bottlenecks: Bottlenecks
  intelligence: CommandIntelligence
}

type AwarenessSnapshot = {
  items: SystemAwarenessItem[]
  global: GlobalAwareness
  command: CommandSnapshot
  confidenceModifier: number
  mode: "stream" | "polling"
  isSyncing: boolean
  isStale: boolean
  isLoading: boolean
  error: string | null
  lastUpdatedAt: number | null
}

// =========================
// DEFAULTS
// =========================

const defaultGlobal: GlobalAwareness = {
  severity: 0,
  dominantMode: "UNKNOWN",
  requiresHumanAttention: false,
  escalation: {
    level: "DEGRADED",
    effects: {
      allowAutomation: false,
      requireHuman: true,
      slowDecisions: true,
    },
  },
  metrics: {
    disputeCount: 0,
    lowConfidence: 0,
    totalAlerts: 0,
  },
  topAlerts: [],
  meta: {
    metaState: "UNAVAILABLE",
    avgConfidence: null,
  },
  degraded: true,
  issues: ["Global awareness unavailable"], // ✅ critical fix
}

const defaultSnapshot: AwarenessSnapshot = {
  items: [],
  global: defaultGlobal,
  command: {
    events: [],
    activeCases: 0,
    pendingGates: 0,
    lockedEscrows: 0,
    alerts: 0,
    nextActions: [],
    bottlenecks: {
      waitingSignature: 0,
      waitingArtifact: 0,
      escrowPending: 0,
    },
    intelligence: {
      instabilityScore: 0,
      throughputPressure: 0,
      systemState: "STABLE",
    },
  },
  confidenceModifier: 0.85,
  mode: "polling",
  isSyncing: true,
  isStale: false,
  isLoading: true,
  error: null,
  lastUpdatedAt: null,
}

const AwarenessContext = createContext<AwarenessSnapshot | null>(null)

// =========================
// NORMALIZATION (KEY FIX)
// =========================

function safeNumber(v: any, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback
}

function normalizeGlobal(payload: any): GlobalAwareness {
  if (!payload || typeof payload !== "object") return defaultGlobal

  return {
    severity: safeNumber(payload.severity),
    dominantMode: payload.dominantMode || "UNKNOWN",
    requiresHumanAttention: Boolean(payload.requiresHumanAttention),

    escalation: {
      level:
        payload.escalation?.level === "CRITICAL" ||
        payload.escalation?.level === "DEGRADED" ||
        payload.escalation?.level === "STABLE"
          ? payload.escalation.level
          : "DEGRADED",

      effects: {
        allowAutomation: Boolean(payload.escalation?.effects?.allowAutomation),
        requireHuman: Boolean(payload.escalation?.effects?.requireHuman),
        slowDecisions: Boolean(payload.escalation?.effects?.slowDecisions),
      },
    },

    metrics: {
      disputeCount: safeNumber(payload.metrics?.disputeCount),
      lowConfidence: safeNumber(payload.metrics?.lowConfidence),
      totalAlerts: safeNumber(payload.metrics?.totalAlerts),
    },

    topAlerts: Array.isArray(payload.topAlerts) ? payload.topAlerts : [],

    meta: {
      metaState: payload.meta?.metaState || "UNAVAILABLE",
      avgConfidence:
        typeof payload.meta?.avgConfidence === "number"
          ? payload.meta.avgConfidence
          : null,
    },

    degraded: Boolean(payload.degraded),
    issues: Array.isArray(payload.issues)
      ? payload.issues
      : ["Malformed global awareness payload"],
  }
}

function normalizeItems(payload: any): SystemAwarenessItem[] {
  if (!Array.isArray(payload)) return []

  return payload.map((item: any, i: number) => ({
    caseId: item.caseId || `unknown-${i}`,
    status: item.status || "UNKNOWN",
    priorityScore: safeNumber(item.priorityScore),
    nextAction: item.nextAction || "UNKNOWN",
    operators: Array.isArray(item.operators) ? item.operators : [],
    council: item.council
      ? {
          finalDecision: item.council.finalDecision ?? null,
          confidence: safeNumber(item.council.confidence),
          breakdown: item.council.breakdown, // restored
        }
      : undefined,
    hierarchy: Array.isArray(item.hierarchy) ? item.hierarchy : [],
    momentum: Array.isArray(item.momentum) ? item.momentum : [],
    alerts: Array.isArray(item.alerts) ? item.alerts : [],
  }))
}

function normalizeEvent(payload: any): DomainEvent | null {
  if (!payload || typeof payload !== "object") return null

  return {
    type: typeof payload.type === "string" ? payload.type : "UNKNOWN",
    createdAt:
      typeof payload.createdAt === "string"
        ? payload.createdAt
        : new Date().toISOString(),
    streamId:
      typeof payload.streamId === "string" ? payload.streamId : undefined,
    payload:
      payload.payload && typeof payload.payload === "object"
        ? payload.payload
        : undefined,
  }
}

function normalizeCommand(payload: any): CommandSnapshot {
  if (!payload || typeof payload !== "object") {
    return defaultSnapshot.command
  }

  const nextActions = Array.isArray(payload.nextActions)
    ? payload.nextActions
        .filter((item: any) => item && typeof item === "object")
        .map((item: any) => ({
          caseId:
            typeof item.caseId === "string" ? item.caseId : "unknown",
          message:
            typeof item.message === "string" ? item.message : "Unknown action",
          priority:
            item.priority === "HIGH" ||
            item.priority === "MEDIUM" ||
            item.priority === "LOW"
              ? item.priority
              : "LOW",
        }))
    : []

  return {
    events: Array.isArray(payload.events)
      ? payload.events
          .map((event: any) => normalizeEvent(event))
          .filter((event: DomainEvent | null): event is DomainEvent => event !== null)
      : [],
    activeCases: safeNumber(payload.activeCases),
    pendingGates: safeNumber(payload.pendingGates),
    lockedEscrows: safeNumber(payload.lockedEscrows),
    alerts: safeNumber(payload.alerts),
    nextActions,
    bottlenecks: {
      waitingSignature: safeNumber(payload.bottlenecks?.waitingSignature),
      waitingArtifact: safeNumber(payload.bottlenecks?.waitingArtifact),
      escrowPending: safeNumber(payload.bottlenecks?.escrowPending),
    },
    intelligence: {
      instabilityScore: safeNumber(payload.intelligence?.instabilityScore),
      throughputPressure: safeNumber(payload.intelligence?.throughputPressure),
      systemState:
        typeof payload.intelligence?.systemState === "string"
          ? payload.intelligence.systemState
          : "STABLE",
    },
  }
}

function reduceCommandEvent(
  prev: CommandSnapshot,
  event: DomainEvent
): CommandSnapshot {
  const events = [event, ...prev.events].slice(0, 100)
  let activeCases = prev.activeCases
  let pendingGates = prev.pendingGates
  let lockedEscrows = prev.lockedEscrows
  let alerts = prev.alerts

  const nextActions = [...prev.nextActions]
  const bottlenecks = { ...prev.bottlenecks }

  if (event.type === "CASE_CREATED") {
    activeCases += 1
  }

  if (event.type === "CASE_COMPLETED") {
    activeCases = Math.max(0, activeCases - 1)
  }

  if (event.type === "GATE_REQUIRED") {
    pendingGates += 1
  }

  if (event.type === "GATE_VERIFIED") {
    pendingGates = Math.max(0, pendingGates - 1)
  }

  if (event.type === "ESCROW_PENDING") {
    bottlenecks.escrowPending += 1
    nextActions.unshift({
      caseId: event.streamId ?? "unknown",
      message: "Lock escrow",
      priority: "HIGH",
    })
  }

  if (event.type === "ESCROW_LOCKED") {
    lockedEscrows += 1
    bottlenecks.escrowPending = Math.max(0, bottlenecks.escrowPending - 1)
  }

  if (event.type === "SIGNATURE_REQUIRED") {
    bottlenecks.waitingSignature += 1
    nextActions.unshift({
      caseId: event.streamId ?? "unknown",
      message: "Collect signature",
      priority: "HIGH",
    })
  }

  if (event.type === "SIGNATURE_COMPLETED") {
    bottlenecks.waitingSignature = Math.max(
      0,
      bottlenecks.waitingSignature - 1
    )
  }

  if (event.type === "ARTIFACT_REQUIRED") {
    bottlenecks.waitingArtifact += 1
    nextActions.unshift({
      caseId: event.streamId ?? "unknown",
      message: "Upload required document",
      priority: "MEDIUM",
    })
  }

  if (event.type === "DOCUMENT_UPLOADED") {
    bottlenecks.waitingArtifact = Math.max(0, bottlenecks.waitingArtifact - 1)
  }

  if (event.type.includes("FAILED") || event.type.includes("ERROR")) {
    alerts += 1
  }

  return {
    ...prev,
    events,
    activeCases,
    pendingGates,
    lockedEscrows,
    alerts,
    nextActions: nextActions.slice(0, 10),
    bottlenecks,
  }
}

// =========================
// HELPERS
// =========================

function getConfidenceModifier(level: GlobalAwareness["escalation"]["level"]) {
  if (level === "CRITICAL") return 0.65
  if (level === "DEGRADED") return 0.85
  return 1
}

function getPollInterval(level: GlobalAwareness["escalation"]["level"]) {
  return POLL_INTERVALS[level]
}

// =========================
// PROVIDER
// =========================

export function AwarenessProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState(defaultSnapshot)
  const snapshotRef = useRef(snapshot)
  const lastStreamAtRef = useRef<number>(Date.now())
  const startPollingRef = useRef<(() => void) | undefined>(undefined)
  const pollingInFlightRef = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()

      if (
        snapshotRef.current.mode === "stream" &&
        now - lastStreamAtRef.current > STALE_AFTER_MS
      ) {
        startPollingRef.current?.()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    snapshotRef.current = snapshot
  }, [snapshot])
  

  useEffect(() => {
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let awarenessSource: EventSource | null = null
    let eventsSource: EventSource | null = null


    async function hydrateCommand() {
      try {
        const res = await fetch("/api/admin/system-snapshot", {
          cache: "no-store",
        })

        if (!res.ok) {
          throw new Error("Bad command snapshot response")
        }

        const json = await res.json()

        if (cancelled) return

        setSnapshot((prev) => ({
          ...prev,
          command: normalizeCommand(json),
        }))
      } catch {
        if (cancelled) return

        setSnapshot((prev) => ({
          ...prev,
          error: prev.error ?? "Command snapshot degraded",
        }))
      }
    }

    function schedulePoll(interval: number) {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(runPoll, interval)
    }

    async function runPoll() {
      if (pollingInFlightRef.current) return
      pollingInFlightRef.current = true

      const now = Date.now()

      try {
        const [systemRes, globalRes] = await Promise.all([
          fetch("/api/admin/system-awareness", { cache: "no-store" }),
          fetch("/api/admin/global-awareness", { cache: "no-store" }),
        ])

        if (!systemRes.ok || !globalRes.ok) {
          throw new Error("Bad response")
        }

        const systemJson = await systemRes.json()
        const globalJson = await globalRes.json()

        if (cancelled) return

        const nextItems = normalizeItems(systemJson.items)
        const nextGlobal = normalizeGlobal(globalJson)

        setSnapshot({
          items: nextItems,
          global: nextGlobal,
          command: snapshotRef.current.command,
          confidenceModifier: getConfidenceModifier(nextGlobal.escalation.level),
          mode: "polling",
          isSyncing: false,
          isStale: false,
          isLoading: false,
          error: null,
          lastUpdatedAt: now,
        })

        schedulePoll(getPollInterval(nextGlobal.escalation.level))
      } catch {
        if (cancelled) return

        setSnapshot((prev) => ({
          ...prev,
          isSyncing: false,
          isStale:
            prev.lastUpdatedAt != null &&
            now - prev.lastUpdatedAt > STALE_AFTER_MS,
          error: "Polling degraded",
        }))

        schedulePoll(getPollInterval(snapshotRef.current.global.escalation.level))
      } finally {
        pollingInFlightRef.current = false
      }
    }

    function startPolling() {
      if (snapshotRef.current.mode === "polling") return

      awarenessSource?.close()
      setSnapshot((p) => ({ ...p, mode: "polling", isSyncing: true }))
      runPoll()
    }

    startPollingRef.current = startPolling


    function startStream() {
      try {
        awarenessSource = new EventSource("/api/admin/awareness/stream")

        setSnapshot((p) => ({ ...p, mode: "stream", isSyncing: true }))

        awarenessSource.onmessage = (event) => {
          if (cancelled) return

          lastStreamAtRef.current = Date.now()

          const payload = JSON.parse(event.data)
          const now = Date.now()

          const nextItems = normalizeItems(payload.items)
          const nextGlobal = normalizeGlobal(payload.global)

          setSnapshot({
            items: nextItems,
            global: nextGlobal,
            command: snapshotRef.current.command,
            confidenceModifier: getConfidenceModifier(nextGlobal.escalation.level),
            mode: "stream",
            isSyncing: false,
            isStale: false,
            isLoading: false,
            error: null,
            lastUpdatedAt: now,
          })
        }

        awarenessSource.onerror = () => {
          awarenessSource?.close()
          startPolling()
        }
      } catch {
        startPolling()
      }
    }

    function startEventsStream() {
      try {
        eventsSource = new EventSource("/api/admin/events/stream")

        eventsSource.onmessage = (event: MessageEvent<string>) => {
          if (cancelled) return

          const nextEvent = normalizeEvent(JSON.parse(event.data))
          if (!nextEvent) return

          setSnapshot((prev) => ({
            ...prev,
            command: reduceCommandEvent(prev.command, nextEvent),
          }))
        }

        eventsSource.onerror = () => {
          eventsSource?.close()
        }
      } catch {
        // keep snapshot state; polling hydrate still provides command data
      }
    }

    hydrateCommand()
    startStream()
    startEventsStream()

    return () => {
      cancelled = true
      startPollingRef.current = undefined
      awarenessSource?.close()
      eventsSource?.close()
      clearTimeout(timeoutId)
    }
  }, [])

  return (
    <AwarenessContext.Provider value={snapshot}>
      {children}
    </AwarenessContext.Provider>
  )
}

export function useAwareness() {
  const ctx = useContext(AwarenessContext)
  if (!ctx) throw new Error("useAwareness must be used within AwarenessProvider")
  return ctx
}
