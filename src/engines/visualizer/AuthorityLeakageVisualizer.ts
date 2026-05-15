import crypto from "crypto"

export type AuthorityEvent =
  | "ETK_DECISION"
  | "POLICY_DECISION"
  | "TRANSFER_EXECUTED"
  | "LEDGER_MUTATION"
  | "BYPASS_USED"
  | "SHADOW_ETK_DECISION"

export type AuthorityNode = {
  id?: string
  type: AuthorityEvent
  entityId: string
  timestamp: number
  traceId?: string
  data?: any
}

export class AuthorityLeakageVisualizer {
  private nodes: Required<AuthorityNode>[] = []

  ingest(event: AuthorityNode) {
    const node: Required<AuthorityNode> = {
      id: event.id ?? crypto.randomUUID(),
      type: event.type,
      entityId: event.entityId,
      timestamp: event.timestamp,
      traceId: event.traceId ?? "",
      data: event.data ?? null,
    }

    this.nodes.push(node)
  }

  getGraph() {
    return this.nodes.sort((a, b) => a.timestamp - b.timestamp)
  }

  detectLeakage() {
    return this.nodes.filter(n =>
      n.type === "POLICY_DECISION"
    )
  }

  reset() {
    this.nodes = []
  }
}

export const authorityLeakageVisualizer =
  new AuthorityLeakageVisualizer()