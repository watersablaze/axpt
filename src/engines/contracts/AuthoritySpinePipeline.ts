import type { AuthoritySpineContract } from "./AuthoritySpineContract"
import type { etk } from "@/engines/execution/kernel/ExecutionTruthKernel"

export type AuthoritySpinePipelineResult = {
  spine: AuthoritySpineContract
  decision: ETKResult
}