import type { UnifiedOrganismState as RuntimeOrganismState } from "@/engines/runtime/AXPTUnifiedOrganismFieldEngine"

export type UnifiedOrganismState = RuntimeOrganismState & {
  narrative?: string
  breathPhase?: string
  breathIntensity?: number
  mutationCount?: number
  evolutionPressure?: number
  lastExecutionStatus?: string
}

export type OrganismProps = {
  organism: UnifiedOrganismState | null
}
