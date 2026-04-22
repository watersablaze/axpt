type Props = {
  roles: {
    role: string
    source: string
  }[]
  permissions: string[]
}

export default function RoleMatrixPanel({
  data,
}: {
  data: Props
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">Role & Permission Matrix</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-sm text-neutral-400">Roles</div>

          <div className="space-y-2">
            {data.roles.map((r) => (
              <div
                key={r.role}
                className="rounded-lg border border-neutral-800 bg-black px-3 py-2 text-sm"
              >
                <div className="font-medium text-white">{r.role}</div>
                <div className="text-xs text-neutral-500">{r.source}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm text-neutral-400">
            Effective Permissions
          </div>

          <div className="max-h-[300px] space-y-1 overflow-auto rounded-lg border border-neutral-800 bg-black p-3">
            {data.permissions.map((p) => (
              <div key={p} className="text-xs text-cyan-400">
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}