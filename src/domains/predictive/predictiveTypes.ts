export type PredictiveSeverity = 'INFO' | 'WARN' | 'CRITICAL'

export type PredictiveSignalType =
  | 'SYNC_LAG_RISING'
  | 'RETRY_PRESSURE'
  | 'DEAD_LETTER_PRESENT'
  | 'RECON_INSTABILITY'
  | 'ASSET_STRESS'

export type PredictiveSignal = {
  type: PredictiveSignalType
  severity: PredictiveSeverity
  assetCode?: string
  message: string
  value?: number
  metadata?: Record<string, unknown>
}

export type PredictiveRecommendation = {
  intent:
    | 'STABILIZE_SYSTEM'
    | 'PREPARE_SETTLEMENT'
    | 'RESUME_SAFE'
  reason: string
  autoRunnable: boolean
  assetCode?: string
}