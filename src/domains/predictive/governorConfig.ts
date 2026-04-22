export const GOVERNOR_CONFIG = {
  syncLagWarnSeconds: 60,
  syncLagCriticalSeconds: 180,

  retryPressureWarn: 5,
  retryPressureCritical: 10,

  reconWarnRepeatThreshold: 2,
  reconCriticalRepeatThreshold: 5,

  assetStressCritical: 5,

  pauseHoldMs: 60_000,
  predictiveCooldownMs: 60_000,

  minAutoExecuteConfidence: 0.7,
  predictiveRecommendationConfidence: 0.5,
} as const