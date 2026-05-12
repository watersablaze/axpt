export type GraphNodeType =
  | "EVENT"
  | "NORMALIZED"
  | "RECONCILIATION"
  | "ESCROW"
  | "GOVERNANCE"
  | "SNAPSHOT"
  | "BROADCAST"
  | "SIMULATION_ROOT"

export type GraphNode = {
  id: string
  type: GraphNodeType
  timestamp: number

  data?: any
}

export type GraphEdge = {
  from: string
  to: string
  reason?: string
}

export class ExecutionGraphEngine {
  private nodes = new Map<string, GraphNode>()
  private edges: GraphEdge[] = []

  addNode(node: GraphNode) {
    this.nodes.set(node.id, node)
  }

  addEdge(edge: GraphEdge) {
    this.edges.push(edge)
  }

  link(from: string, to: string, reason?: string) {
    this.edges.push({ from, to, reason })
  }

  getNode(id: string) {
    return this.nodes.get(id)
  }

  getGraph() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
    }
  }

  /**
   * 🔍 CAUSAL TRACE: find full lineage of an event
   */
  trace(id: string, visited = new Set<string>()): string[] {
    if (visited.has(id)) return []
    visited.add(id)

    const children = this.edges
      .filter(e => e.from === id)
      .map(e => e.to)

    return [
      id,
      ...children.flatMap(child => this.trace(child, visited)),
    ]
  }
}

export const executionGraph = new ExecutionGraphEngine()
