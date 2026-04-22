export type PowerSnapshotLike = {
  operatorId: string
  power: number
  createdAt?: Date | string
}

export type MomentumSignal = {
  operatorId: string
  currentPower: number
  previousPower: number
  velocity: number
  signal: "SURGING" | "RISING" | "STABLE" | "FADING" | "COLLAPSING"
}

export function computePowerMomentum(
  current: { operatorId: string; power: number }[],
  previous: PowerSnapshotLike[]
): MomentumSignal[] {
  return current.map((node) => {
    const prev = previous.find((p) => p.operatorId === node.operatorId)

    const previousPower = prev?.power ?? 0
    const velocity = node.power - previousPower

    let signal: MomentumSignal["signal"] = "STABLE"

    if (velocity > 0.4) signal = "SURGING"
    else if (velocity > 0.15) signal = "RISING"
    else if (velocity < -0.4) signal = "COLLAPSING"
    else if (velocity < -0.15) signal = "FADING"

    return {
      operatorId: node.operatorId,
      currentPower: node.power,
      previousPower,
      velocity,
      signal,
    }
  })
}