export function mapChainEventToOrganism(event: any) {

  switch (event.type) {

    case "ESCROW_LOCKED":
      return {
        driftImpact: +0.1,
        liquidityImpact: -0.2,
        riskSignal: "INCREASE",
        executionState: "LOCKED_FLOW",
      }

    case "ESCROW_RELEASED":
      return {
        driftImpact: -0.1,
        liquidityImpact: +0.3,
        riskSignal: "STABILIZE",
        executionState: "SETTLED_FLOW",
      }

    default:
      return {
        driftImpact: 0,
        liquidityImpact: 0,
        riskSignal: "NEUTRAL",
        executionState: "UNKNOWN",
      }
  }
}