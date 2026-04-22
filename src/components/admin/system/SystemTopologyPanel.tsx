"use client"

import { useMemo, useState } from "react"
import PanelWrapper from "@/components/admin/system/PanelWrapper"
import {
  useAwareness,
  type AwarenessAlert,
  type AwarenessOperator,
} from "@/lib/realtime/AwarenessProvider"

type Node = {
  id: string
  type: "CASE" | "OPERATOR"
  power?: number
  alert?: boolean
  name?: string
  role?: string
  decision?: string
  momentum?: number
}

type Edge = {
  source: string
  target: string
}

type Props = {
  caseId: string
  operators?: AwarenessOperator[]
  hierarchy?: Array<Record<string, any>>
  momentum?: Array<Record<string, any>>
  alerts?: AwarenessAlert[]
  dominant?: string
  decision?: string | null
  confidence?: number
}

const WIDTH = 320
const HEIGHT = 260
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 }

export default function SystemTopologyPanel({
  caseId,
  operators = [],
  hierarchy = [],
  momentum = [],
  alerts = [],
  dominant,
  decision,
  confidence = 0,
}: Props) {
  const { confidenceModifier } = useAwareness()
  const [hovered, setHovered] = useState<string | null>(null)

  const graph = useMemo(() => {
    const nodes: Node[] = [{ id: caseId, type: "CASE" }]
    const edges: Edge[] = []

    const hasCriticalAlert = alerts.some(a => a.level === "CRITICAL")

    operators.forEach((operator) => {
      const nodeHierarchy = hierarchy.find(h => h.operatorId === operator.operatorId)
      const nodeMomentum = momentum.find(m => m.operatorId === operator.operatorId)

      nodes.push({
        id: operator.operatorId,
        type: "OPERATOR",
        name: operator.name,
        role: operator.role,
        decision: operator.decision,
        power: nodeHierarchy?.power || 1,
        momentum: nodeMomentum?.velocity || 0,
        alert: hasCriticalAlert,
      })

      edges.push({
        source: operator.operatorId,
        target: caseId,
      })
    })

    return { nodes, edges }
  }, [alerts, caseId, hierarchy, momentum, operators])

  const hoveredNode = graph.nodes.find(n => n.id === hovered)

  const positions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {}

    const caseNode = graph.nodes.find(n => n.type === "CASE")
    const operators = graph.nodes.filter(n => n.type === "OPERATOR")

    if (caseNode) map[caseNode.id] = CENTER

    const radius = 80

    operators.forEach((node, i) => {
      const angle = (i / Math.max(operators.length, 1)) * Math.PI * 2

      map[node.id] = {
        x: CENTER.x + Math.cos(angle) * radius,
        y: CENTER.y + Math.sin(angle) * radius,
      }
    })

    return map
  }, [graph])

  if (graph.nodes.length <= 1) return null

  const decisionColor =
    decision === "APPROVE"
      ? "#00ffcc"
      : decision === "DELAY"
      ? "#ffcc00"
      : decision === "OVERRIDE"
      ? "#ff0033"
      : "#888"

  return (
    <PanelWrapper title="System Topology">
      <div className="relative h-[260px] w-[320px] mx-auto">

        {/* FIELD GLOW */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${decisionColor} 0%, transparent 70%)`,
            opacity: confidence * confidenceModifier,
          }}
        />

        {/* EDGES */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {graph.edges.map((e, i) => {
            const s = positions[e.source]
            const t = positions[e.target]
            if (!s || !t) return null

            const isConnected =
              hovered && (e.source === hovered || e.target === hovered)

            const isDominant =
              dominant && (e.source === dominant || e.target === dominant)

            return (
              <line
                key={i}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={
                  isConnected
                    ? "rgba(0,255,200,0.9)"
                    : isDominant
                    ? "rgba(0,255,200,0.4)"
                    : "rgba(0,255,200,0.08)"
                }
                strokeWidth={isConnected ? 2.5 : 1}
              />
            )
          })}

          {/* FLOW */}
          {graph.edges.map((e, i) => {
            const s = positions[e.source]
            const t = positions[e.target]
            if (!s || !t) return null

            return (
              <circle key={i} r="2" fill={decisionColor}>
                <animateMotion
                  dur={`${2 + confidence * 4}s`}
                  repeatCount="indefinite"
                  path={`M ${s.x} ${s.y} L ${t.x} ${t.y}`}
                />
              </circle>
            )
          })}
        </svg>

        {/* NODES */}
        {graph.nodes.map(node => {
          const pos = positions[node.id]
          if (!pos) return null

          const size = node.type === "CASE" ? 24 : 10 + (node.power || 1) * 6
          const isHovered = node.id === hovered

          return (
            <div
              key={node.id}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
              className={`absolute rounded-full transition-all duration-300 ${
                node.alert ? "bg-red-500" :
                node.type === "CASE" ? "bg-emerald-500" : "bg-cyan-500"
              }`}
              style={{
                width: size,
                height: size,
                left: pos.x - size / 2,
                top: pos.y - size / 2,
                transform: `scale(${isHovered ? 1.15 : 1})`,
              }}
            />
          )
        })}
      </div>

      {hoveredNode?.type === "OPERATOR" && (
        <div className="mt-4 border border-neutral-800 rounded-lg p-3 bg-black/70 backdrop-blur-[2px] text-xs">
          <div className="text-white font-medium">{hoveredNode.name}</div>
          <div className="text-neutral-400">{hoveredNode.role}</div>
        </div>
      )}
    </PanelWrapper>
  )
}