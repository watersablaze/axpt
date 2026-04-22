import { toast } from 'sonner'

type PauseState = {
  globalPaused?: boolean
  pausedAssets?: unknown
  pausedLayers?: unknown
}

type SyncResult = {
  inserted?: number
}

type PredictiveResult = {
  autoExecutedCount?: number
  recommendationCount?: number
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

export function toastPauseResult(state: PauseState) {
  const assets = asStringArray(state.pausedAssets)
  const layers = asStringArray(state.pausedLayers)

  if (state.globalPaused) {
    toast.success('System paused -> global controls engaged')
    return
  }

  if (layers.length > 0) {
    toast.success(`${layers.join(', ')} paused -> control state updated`)
    return
  }

  if (assets.length > 0) {
    toast.success(`Pause applied -> ${assets.join(', ')}`)
    return
  }

  toast.success('System resumed -> restrictions cleared')
}

export function toastSyncResult(result: SyncResult) {
  const inserted = result.inserted ?? 0

  if (inserted === 0) {
    toast('Sync skipped -> already up to date')
    return
  }

  toast.success(`Sync completed -> ${inserted} events indexed`)
}

export function toastPredictiveResult(result: PredictiveResult) {
  const executed = result.autoExecutedCount ?? 0
  const recommendations = result.recommendationCount ?? 0

  if (executed > 0) {
    toast.success(`System stabilized -> ${executed} actions executed`)
    return
  }

  if (recommendations > 0) {
    toast(`Predictive engine reviewed ${recommendations} recommendations`)
    return
  }

  toast('Predictive engine found no action worth taking')
}

export function toastIntentResult(intent: string, actions?: number) {
  const actionCount = actions ?? 0

  if (actionCount > 0) {
    toast.success(`${intent} -> ${actionCount} actions planned`)
    return
  }

  toast(`${intent} -> no actions required`)
}
