type Props = {
  principalEmail: string | null
  roles: string[]
  permissionCount: number
  authSource: string
  legacySignals: number
  environment: string
}

export default function SecurityStatusStrip({ data }: { data: Props }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <div className="grid gap-4 lg:grid-cols-6 text-sm">
        <Metric label="Principal" value={data.principalEmail ?? 'Unknown'} />
        <Metric label="Roles" value={String(data.roles.length)} />
        <Metric label="Permissions" value={String(data.permissionCount)} />
        <Metric label="Auth Source" value={data.authSource} />
        <Metric
          label="Legacy Signals"
          value={String(data.legacySignals)}
          tone={data.legacySignals > 0 ? 'warning' : 'success'}
        />
        <Metric label="Environment" value={data.environment} />
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'warning' | 'success'
}) {
  const color =
    tone === 'warning'
      ? 'text-yellow-400'
      : tone === 'success'
      ? 'text-green-400'
      : 'text-white'

  return (
    <div>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className={`text-sm font-medium ${color}`}>{value}</div>
    </div>
  )
}