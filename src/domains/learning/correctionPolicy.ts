export type CorrectionMode =
  | 'NONE'
  | 'ADVISORY'
  | 'REPLAN'
  | 'RESTRICT_AUTONOMY'

export function getCorrectionMode(args: {
  driftScore: number
  governorState: string
}) : CorrectionMode {
  const { driftScore, governorState } = args

  if (governorState === 'PAUSED') return 'NONE'

  if (driftScore > 0.4) {
    return 'RESTRICT_AUTONOMY'
  }

  if (driftScore > 0.25) {
    return 'REPLAN'
  }

  if (driftScore > 0.15) {
    return 'ADVISORY'
  }

  return 'NONE'
}