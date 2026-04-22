type Props = {
  mode: string
  pressureScore: number
  txVelocity: number
  riskDensity: number
  throttleMultiplier: number
  cooldownMs: number
  breakerLevel: string
}

export default function SystemModePanel({ data }: { data: Props }) {
  const color =
    data.mode === 'LOCKDOWN'
      ? 'text-red-400'
      : data.mode === 'DEFENSIVE'
      ? 'text-orange-400'
      : data.mode === 'ELEVATED'
      ? 'text-yellow-400'
      : 'text-green-400'

  return (
    <div className="rounded-xl border border-neutral-800 bg-black/60 p-5">
      <div className="text-xs uppercase text-neutral-500">
        System Mode
      </div>

      <div className={`mt-2 text-2xl font-semibold ${color}`}>
        {data.mode}
      </div>

      <div className="mt-4 grid gap-4 text-sm text-neutral-400 md:grid-cols-3 lg:grid-cols-6">
        <div>
          <div className="text-neutral-500">Pressure</div>
          <div>{data.pressureScore.toFixed(2)}</div>
        </div>

        <div>
          <div className="text-neutral-500">Tx Velocity</div>
          <div>{data.txVelocity}</div>
        </div>

        <div>
          <div className="text-neutral-500">Risk Density</div>
          <div>{data.riskDensity.toFixed(2)}</div>
        </div>

        <div>
          <div className="text-neutral-500">Throttle</div>
          <div>{data.throttleMultiplier.toFixed(2)}x</div>
        </div>

        <div>
          <div className="text-neutral-500">Cooldown</div>
          <div>{Math.round(data.cooldownMs / 1000)}s</div>
        </div>

        <div>
          <div className="text-neutral-500">Breaker</div>
          <div>{data.breakerLevel}</div>
        </div>
      </div>
    </div>
  )
}
