// src/components/admin/system/SystemFieldPanel.tsx

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  useAwareness,
  type AwarenessOperator,
} from "@/lib/realtime/AwarenessProvider"

type Node = {
  id: string
  type: "CASE" | "OPERATOR"
  weight: number
  label: string
}

type Edge = {
  source: string
  target: string
  weight: number
}

type Position = {
  x: number
  y: number
  vx: number
  vy: number
}

type HistoryFrame = {
  timestamp: number
  positions: Record<string, { x: number; y: number }>
  totalCaseWeight: number
}

const MAX_HISTORY = 18

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function hash(input: string) {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function seed(
  id: string,
  type: Node["type"],
  i: number,
  width: number,
  height: number
): Position {
  const s = hash(id + i)
  const angle = (s % 360) * (Math.PI / 180)
  const center = { x: width / 2, y: height / 2 }
  const radius =
    type === "CASE"
      ? Math.min(width, height) * 0.35
      : Math.min(width, height) * 0.55

  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
    vx: 0,
    vy: 0,
  }
}

export default function SystemFieldPanel() {
  const {
    items,
    global,
    confidenceModifier,
    mode,
    isStale,
    isLoading,
    isSyncing,
  } = useAwareness()

  const containerRef = useRef<HTMLDivElement | null>(null)
  const [bounds, setBounds] = useState({ width: 800, height: 500 })
  const [positions, setPositions] = useState<Record<string, Position>>({})
  const [history, setHistory] = useState<HistoryFrame[]>([])
  const [lastHistoryAt, setLastHistoryAt] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return

    const resize = () => {
      const rect = containerRef.current!.getBoundingClientRect()
      setBounds({
        width: rect.width,
        height: rect.height,
      })
    }

    resize()

    const observer = new ResizeObserver(resize)
    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [])

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []
    const operatorMap: Record<string, Node> = {}
    const operatorCases: Record<string, string[]> = {}

    items.forEach((item) => {
      const confidence = item.council?.confidence ?? 0
      const influence = Math.max(
        0.25,
        confidence * confidenceModifier + item.alerts.length * 0.12
      )

      nodes.push({
        id: item.caseId,
        type: "CASE",
        weight: influence,
        label: item.caseId.slice(0, 6),
      })

      item.operators.forEach((op: AwarenessOperator) => {
        if (!operatorMap[op.operatorId]) {
          operatorMap[op.operatorId] = {
            id: op.operatorId,
            type: "OPERATOR",
            weight: 0.6,
            label: op.name || op.operatorId.slice(0, 4),
          }
        }

        edges.push({
          source: op.operatorId,
          target: item.caseId,
          weight: influence,
        })

        if (!operatorCases[op.operatorId]) {
          operatorCases[op.operatorId] = []
        }
        operatorCases[op.operatorId].push(item.caseId)
      })
    })

    Object.values(operatorCases).forEach((caseIds) => {
      if (caseIds.length < 2) return

      for (let i = 0; i < caseIds.length; i++) {
        for (let j = i + 1; j < caseIds.length; j++) {
          edges.push({
            source: caseIds[i],
            target: caseIds[j],
            weight: 0.25,
          })
        }
      }
    })

    return {
      nodes: [...nodes, ...Object.values(operatorMap)],
      edges,
    }
  }, [items, confidenceModifier])

  useEffect(() => {
    setPositions((prev) => {
      const next: Record<string, Position> = {}

      nodes.forEach((node, index) => {
        next[node.id] =
          prev[node.id] ?? seed(node.id, node.type, index, bounds.width, bounds.height)
      })

      return next
    })
  }, [bounds.height, bounds.width, nodes])

  useEffect(() => {
    let frame = 0

    const gravity =
      global.escalation.level === "CRITICAL"
        ? 0.016
        : global.escalation.level === "DEGRADED"
        ? 0.012
        : 0.009

    const drift = mode === "stream" ? 0.18 : 0.1
    const center = { x: bounds.width / 2, y: bounds.height / 2 }

    const tick = () => {
      setPositions((prev) => {
        const next = { ...prev }

        nodes.forEach((node, index) => {
          const current =
            next[node.id] ??
            seed(node.id, node.type, index, bounds.width, bounds.height)

            edges.forEach((edge) => {
              if (edge.source === node.id || edge.target === node.id) {
                const otherId =
                  edge.source === node.id ? edge.target : edge.source

                const other = next[otherId]
                if (!other) return

                const dx = other.x - current.x
                const dy = other.y - current.y

                current.x += dx * 0.01 * edge.weight
                current.y += dy * 0.01 * edge.weight
              }
            })

            nodes.forEach((otherNode) => {
              if (otherNode.id === node.id) return

              const other = next[otherNode.id]
              if (!other) return

              const dx = current.x - other.x
              const dy = current.y - other.y
              const dist = Math.sqrt(dx * dx + dy * dy) + 0.01

              if (dist < 120) {
                const force = 0.4 / dist
                current.x += dx * force
                current.y += dy * force
              }
            })

            current.x += (center.x - current.x) * 0.002
            current.y += (center.y - current.y) * 0.002


          current.x += Math.sin(Date.now() / 800 + hash(node.id)) * drift
          current.y += Math.cos(Date.now() / 1000 + hash(node.id)) * drift

          next[node.id] = {
            ...current,
            x: clamp(current.x, 30, bounds.width - 30),
            y: clamp(current.y, 30, bounds.height - 30),
          }
        })

        return next
      })

      frame = requestAnimationFrame(tick)
    }

    tick()
    return () => cancelAnimationFrame(frame)
  }, [bounds.height, bounds.width, global.escalation.level, mode, nodes])

  useEffect(() => {
    const now = Date.now()
    if (now - lastHistoryAt < 250) return

    const frame: Record<string, { x: number; y: number }> = {}

    nodes.forEach((node) => {
      const position = positions[node.id]
      if (position) {
        frame[node.id] = { x: position.x, y: position.y }
      }
    })

    const total = nodes
      .filter((node) => node.type === "CASE")
      .reduce((sum, node) => sum + node.weight, 0)

    setHistory((prev) =>
      [
        ...prev,
        {
          timestamp: now,
          positions: frame,
          totalCaseWeight: total,
        },
      ].slice(-MAX_HISTORY)
    )

    setLastHistoryAt(now)
  }, [lastHistoryAt, nodes, positions])

  const trend =
    history.length > 1
      ? history.at(-1)!.totalCaseWeight - history.at(-2)!.totalCaseWeight
      : 0

  if (!nodes.length) {
    return (
      <div className="relative w-full h-[680px] xl:h-[720px] rounded-xl border border-neutral-800 bg-black/60 backdrop-blur-[2px] ring-1 ring-cyan-500/10 overflow-hidden flex items-center justify-center text-sm text-neutral-500">
        <div className="absolute top-3 left-4 text-xs text-neutral-400 uppercase tracking-wide">
          System Intelligence Field
        </div>
        <div className="absolute top-3 right-4 text-xs text-neutral-500">
          {mode.toUpperCase()}
        </div>
          {isLoading ? "Loading field..." : "No field data"}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[680px] xl:h-[720px] rounded-xl border border-neutral-800 bg-black/60 backdrop-blur-[2px] ring-1 ring-cyan-500/10 overflow-hidden"
    >
      <div className="absolute top-3 left-4 text-xs text-neutral-400 uppercase tracking-wide">
        System Intelligence Field
      </div>

      <div className="absolute top-3 right-4 text-xs text-neutral-500">
        {mode.toUpperCase()}
      </div>

      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,200,0.18),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(0,255,200,0.08),transparent_80%)]" />
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            global.escalation.level === "CRITICAL"
              ? "radial-gradient(circle at center, rgba(255,0,80,0.18) 0%, transparent 72%)"
              : global.escalation.level === "DEGRADED"
              ? "radial-gradient(circle at center, rgba(255,200,0,0.12) 0%, transparent 72%)"
              : "radial-gradient(circle at center, rgba(0,255,200,0.08) 0%, transparent 72%)",
          opacity:
            global.meta.avgConfidence != null
              ? global.meta.avgConfidence * confidenceModifier
              : confidenceModifier,
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.32) 100%)",
        }}
      />

        {history.map((frame, index) => {
          const alpha = (index + 1) / history.length

          return Object.entries(frame.positions).map(([id, position]) => (
            <div
              key={`${frame.timestamp}-${id}`}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 6,
                height: 6,
                left: position.x,
                top: position.y,
                transform: "translate(-50%, -50%)",
                background: `rgba(0,255,200,${alpha * 0.15})`,
                boxShadow: `0 0 14px rgba(0,255,200,${alpha * 0.12})`,
              }}
            />
          ))
        })}

        <svg className="absolute inset-0 h-full w-full pointer-events-none">
          {edges.map((edge, index) => {
            const source = positions[edge.source]
            const target = positions[edge.target]
            if (!source || !target) return null

            return (
                <line
                  key={`edge-${index}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="rgba(0,255,200,0.28)"
                  strokeWidth={1.25 + edge.weight}
                />
              )
            })}

          {!isStale &&
            edges.map((edge, index) => {
              const source = positions[edge.source]
              const target = positions[edge.target]
              if (!source || !target) return null

              return (
                <circle key={`flow-${index}`} r="3.5" fill="rgba(0,255,200,0.9)">
                  <animateMotion
                    dur={`${2 + edge.weight * 2}s`}
                    repeatCount="indefinite"
                    path={`M ${source.x} ${source.y} L ${target.x} ${target.y}`}
                  />
                </circle>
              )
            })}
        </svg>

        {nodes.map((node) => {
          const position = positions[node.id]
          if (!position) return null

          const isCase = node.type === "CASE"
          const size = isCase
            ? 40 + node.weight * 32
            : 16 + node.weight * 10

          return (
            <div
              key={node.id}
              className="absolute"
              style={{
                left: position.x,
                top: position.y,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className={`rounded-full ${
                  isCase ? "bg-emerald-400" : "bg-cyan-400"
                }`}
                style={{
                  width: size,
                  height: size,
                  opacity: isStale ? 0.55 : 0.9,
                  boxShadow: isCase
                    ? "0 0 24px rgba(0,255,200,0.55)"
                    : "0 0 12px rgba(0,255,200,0.35)",
                }}
              />
              {node.type === "CASE" && node.weight > 0.9 && (
                <div className="absolute text-[9px] text-white/70 mt-6 whitespace-nowrap">
                  {node.label}
                </div>
              )}
            </div>
          )
        })}

        <div className="absolute right-4 top-4 text-xs text-neutral-400">
          {trend > 0.03
            ? "↑ Escalating"
            : trend < -0.03
            ? "↓ Stabilizing"
            : "→ Stable"}
        </div>

        <div className="absolute left-4 bottom-4 text-xs text-neutral-500">
          {isSyncing ? "Syncing…" : global.dominantMode}
        </div>
    </div>
  )
}
