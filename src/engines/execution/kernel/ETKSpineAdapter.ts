import type { ExecutionSignal } from "@/engines/contracts/ExecutionContracts"
import { AuthoritySpineCompiler } from "@/engines/operator/AuthoritySpineCompiler"
import { etk } from "./ExecutionTruthKernel"

const spineCompiler = new AuthoritySpineCompiler()

/**
 * 🧠 LEGACY COMPATIBILITY LAYER (SAFE BRIDGE ONLY)
 */
export function etkFromSignals(
  signals: ExecutionSignal[],
  entityId: string,
  ctx?: unknown
) {
  const spine = spineCompiler.build(signals, entityId, ctx)
  return etk.decide(spine)
}