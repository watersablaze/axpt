type SystemPattern = {
  mismatchLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  deadLetterLevel: 'LOW' | 'HIGH'
  syncLagLevel: 'LOW' | 'HIGH'
}

export function extractSystemPattern(state: {
  mismatches: number
  deadLetters: number
  syncLag: number
}): SystemPattern {
  return {
    mismatchLevel:
      state.mismatches > 20
        ? 'HIGH'
        : state.mismatches > 5
        ? 'MEDIUM'
        : 'LOW',

    deadLetterLevel:
      state.deadLetters > 10 ? 'HIGH' : 'LOW',

    syncLagLevel:
      state.syncLag > 100 ? 'HIGH' : 'LOW',
  }
}