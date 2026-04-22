export type IntentType =
  | 'STABILIZE_SYSTEM'
  | 'PREPARE_SETTLEMENT'
  | 'RESUME_SAFE'

export type IntentContext = {
  assets?: string[]
}