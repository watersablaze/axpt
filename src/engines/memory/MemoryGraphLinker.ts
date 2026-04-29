import type { MemoryNode } from './MemoryGraphTypes'

export class MemoryGraphLinker {
  link(nodes: MemoryNode[]) {
    return nodes.map((node, index) => ({
      ...node,
      causalParents: nodes
        .slice(0, index)
        .slice(-3)
        .map((n) => n.id),
    }))
  }
}