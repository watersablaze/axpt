import { allowedGraph } from "./allowedDependencyGraph"
import { resolveLayer } from "./layerResolver"

export class DAGValidator {

  validate(edges: Array<{ from: string; to: string }>) {

    const violations: string[] = []

    for (const edge of edges) {

      const fromLayer = resolveLayer(edge.from)
      const toLayer = resolveLayer(edge.to)

      const allowed = allowedGraph[fromLayer] || []

      if (!allowed.includes(toLayer)) {
        violations.push(
          `${fromLayer} → ${toLayer} not allowed (${edge.from})`
        )
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `[DAG VIOLATION]\n` + violations.join("\n")
      )
    }

    return true
  }
}

export const dagValidator = new DAGValidator()