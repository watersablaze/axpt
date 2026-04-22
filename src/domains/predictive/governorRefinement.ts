export function resolveGovernorPolicy(args: {
  governorState: string
  holdUntil?: string | null
}) {
  const { governorState, holdUntil } = args

  let forceAdvisory = false
  let forceSimulation = false
  let autonomyAllowed = true

  if (governorState === 'UNSTABLE') {
    forceSimulation = true
  }

  if (governorState === 'RESTRICTED') {
    forceAdvisory = true
    forceSimulation = true
    autonomyAllowed = false
  }

  if (governorState === 'PAUSED') {
    forceAdvisory = true
    forceSimulation = true
    autonomyAllowed = false
  }

  return {
    governorState,
    forceAdvisory,
    forceSimulation,
    autonomyAllowed,
    holdUntil: holdUntil ?? null,
  }
}