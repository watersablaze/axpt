export type SpineNodeType =
  | "SIGNAL"
  | "SPINE"
  | "DECISION"
  | "EXECUTION"

export type SpineNode = {
  id: string
  type: SpineNodeType
  entityId: string
  timestamp: number

  label: string
  severity?: number
  confidence?: number

  metadata?: Record<string, any>
}

export type SpineEdge = {
  from: string
  to: string
  weight: number
  reason?: string
}

export class AuthoritySpineGraphEngine {

  private nodes = new Map<string, SpineNode>()
  private edges: SpineEdge[] = []

  addNode(node: SpineNode) {
    this.nodes.set(node.id, node)
  }

  addEdge(edge: SpineEdge) {
    this.edges.push(edge)
  }

  /**
   * 🧠 TRACE FULL AUTHORITY FLOW
   */
  trace(entityId: string) {
    const nodes = [...this.nodes.values()]
      .filter(n => n.entityId === entityId)

    const edges = this.edges.filter(e =>
      nodes.find(n => n.id === e.from || n.id === e.to)
    )

    return {
      nodes,
      edges,
    }
  }

  /**
   * 🧠 BUILD VISUAL SPINE FROM ETK RESULT
   */
  ingestETK(entityId: string, signals: any[], spine: any, etkResult: any) {

    const signalNodes = signals.map((s, i) => ({
      id: `sig_${entityId}_${i}`,
      type: "SIGNAL" as const,
      entityId,
      timestamp: Date.now(),
      label: s.type,
      severity: s.severity,
      confidence: s.confidence,
      metadata: s,
    }))

    const spineNode: SpineNode = {
      id: `spine_${entityId}_${Date.now()}`,
      type: "SPINE",
      entityId,
      timestamp: Date.now(),
      label: "Authority Spine",
      confidence: spine.reality?.confidence,
      metadata: spine,
    }

    const decisionNode: SpineNode = {
      id: `decision_${entityId}_${Date.now()}`,
      type: "DECISION",
      entityId,
      timestamp: Date.now(),
      label: etkResult.decision.status,
      severity: etkResult.trace.metrics?.risk,
      confidence: etkResult.decision.confidence,
      metadata: etkResult,
    }

    this.addNode(spineNode)
    this.addNode(decisionNode)

    for (const s of signalNodes) {
      this.addNode(s)

      this.addEdge({
        from: s.id,
        to: spineNode.id,
        weight: s.severity ?? 0,
        reason: "signal→spine",
      })
    }

    this.addEdge({
      from: spineNode.id,
      to: decisionNode.id,
      weight: 1,
      reason: "spine→etk",
    })
  }
}

export const authoritySpineGraphEngine =
  new AuthoritySpineGraphEngine()