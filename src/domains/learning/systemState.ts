export function deriveSystemState(state: {
  mismatches: number
  deadLetters: number
  syncLag: number
}) {
  if (state.deadLetters > 20 || state.syncLag > 200) {
    return 'CRITICAL'
  }

  if (state.mismatches > 10) {
    return 'VOLATILE'
  }

  return 'STABLE'
}
