export type PowerSnapshot = {
  operatorId: string
  power: number
}

export type MomentumResult = {
  operatorId: string
  velocity: number
  acceleration: number
  direction: "RISING" | "FALLING" | "STABLE"
  strength: number
}

export function computePowerMomentum(
  current: PowerSnapshot[],
  previous: { operatorId: string; power: number }[]
): MomentumResult[] {
  return current.map((curr) => {
    const prev = previous.find(p => p.operatorId === curr.operatorId)

    if (!prev) {
      return {
        operatorId: curr.operatorId,
        velocity: 0,
        acceleration: 0,
        direction: "STABLE",
        strength: 0,
      }
    }

    const velocity = curr.power - prev.power

    // simple acceleration proxy (can expand later)
    const acceleration = velocity * 0.5

    let direction: "RISING" | "FALLING" | "STABLE" = "STABLE"

    if (velocity > 0.05) direction = "RISING"
    else if (velocity < -0.05) direction = "FALLING"

    const strength = Math.abs(velocity) + Math.abs(acceleration)

    return {
      operatorId: curr.operatorId,
      velocity,
      acceleration,
      direction,
      strength,
    }
  })
}