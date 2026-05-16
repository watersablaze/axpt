import type { AuthoritySpineContract } from "./AuthoritySpineContract"
import type { etk, ETKGateResult } from "@/engines/execution/kernel/ExecutionTruthKernel"

export type AuthoritySpinePipelineResult = {
  spine: AuthoritySpineContract
  decision: ETKGateResult
}