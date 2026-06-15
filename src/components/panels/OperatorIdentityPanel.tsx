'use client'

type OperatorAuthority = {
  status: string
  detail: string
}

type OperatorIdentity = {
  email: string
  roles: string[]
  permissionCount: number
  sessionActive: boolean
  session?: {
    active: boolean
    totalActions: number
    approvalsGranted: number
    transitionsExecuted: number
    artifactsGenerated: number
    incidentsResolved: number
    lastActionAt: string | null
    lastActionLabel: string | null
  }
  authority?: {
    transitionAuthority: OperatorAuthority
    approvalAuthority: OperatorAuthority
    incidentAuthority: OperatorAuthority
    treasuryAuthority: OperatorAuthority
    artifactAuthority: OperatorAuthority
  }
}

type Props = {
  operator?: OperatorIdentity | null
}

function authorityTone(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'border-emerald-900 bg-emerald-950/20 text-emerald-300'

    case 'PENDING':
      return 'border-orange-900 bg-orange-950/20 text-orange-300'

    case 'LIMITED':
      return 'border-neutral-700 bg-black/30 text-neutral-300'

    default:
      return 'border-neutral-800 bg-black/30 text-neutral-400'
  }
}

function formatTime(value?: string | null) {
  if (!value) return '—'

  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function OperatorIdentityPanel({
  operator,
}: Props) {
  const authorityItems = operator?.authority
    ? [
        [
          'Transition',
          operator.authority.transitionAuthority,
        ],
        [
          'Approval',
          operator.authority.approvalAuthority,
        ],
        [
          'Incident',
          operator.authority.incidentAuthority,
        ],
        [
          'Treasury',
          operator.authority.treasuryAuthority,
        ],
        [
          'Artifact',
          operator.authority.artifactAuthority,
        ],
      ] as const
    : []

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Operator Identity
          </div>

          <h2 className="mt-1 text-lg font-medium text-white">
            Authority Profile
          </h2>
        </div>

        <div className="rounded border border-emerald-900 bg-emerald-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-emerald-300">
          {operator?.session?.active ?? operator?.sessionActive
            ? 'Active'
            : 'Unknown'}
        </div>
      </div>

      {!operator ? (
        <div className="rounded border border-neutral-800 bg-black/30 p-2 text-xs text-neutral-500">
          Operator identity unavailable.
        </div>
      ) : (
        <div className="space-y-3 text-xs">
          <div className="rounded border border-neutral-800 bg-black/20 p-2">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500">
              Signed In As
            </div>

            <div className="mt-1 text-sm font-medium text-white">
              {operator.email}
            </div>
          </div>

          <div className="rounded border border-neutral-800 bg-black/20 p-2">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500">
              Roles
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {operator.roles.map((role) => (
                <span
                  key={role}
                  className="rounded border border-cyan-900 bg-cyan-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-cyan-300"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded border border-neutral-800 bg-black/20 p-2">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500">
              Active Permissions
            </div>

            <div className="mt-1 text-lg font-medium text-white">
              {operator.permissionCount}
            </div>
          </div>

          <div className="rounded border border-neutral-800 bg-black/20 p-2">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500">
              Session Context
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                  Approvals Granted
                </div>

                <div className="mt-1 text-sm font-medium text-white">
                  {operator.session?.approvalsGranted ?? 0}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                  Transitions Executed
                </div>

                <div className="mt-1 text-sm font-medium text-white">
                  {operator.session?.transitionsExecuted ?? 0}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                  Artifacts Generated
                </div>

                <div className="mt-1 text-sm font-medium text-white">
                  {operator.session?.artifactsGenerated ?? 0}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                  Incidents Resolved
                </div>

                <div className="mt-1 text-sm font-medium text-white">
                  {operator.session?.incidentsResolved ?? 0}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                  Total Actions
                </div>

                <div className="mt-1 text-sm font-medium text-white">
                  {operator.session?.totalActions ?? 0}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                  Last Activity
                </div>

                <div className="mt-1 text-sm font-medium text-white">
                  {formatTime(
                    operator.session?.lastActionAt
                  )}
                </div>
              </div>
            </div>

            {operator.session?.lastActionLabel ? (
              <div className="mt-2 rounded border border-neutral-800 bg-black/30 px-2 py-1 text-[11px] text-neutral-400">
                <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                  Last Action
                </div>

                <div className="mt-1">
                  {operator.session.lastActionLabel}
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded border border-neutral-800 bg-black/20 p-2">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500">
              Operator Authority
            </div>

            {authorityItems.length === 0 ? (
              <div className="mt-2 rounded border border-neutral-800 bg-black/30 p-2 text-neutral-500">
                Authority profile unavailable.
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {authorityItems.map(([label, authority]) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-3 border-b border-neutral-900 pb-2 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white">
                        {label}
                      </div>

                      <div className="mt-0.5 text-[10px] leading-snug text-neutral-500">
                        {authority.detail}
                      </div>
                    </div>

                    <div
                      className={`shrink-0 rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${authorityTone(
                        authority.status
                      )}`}
                    >
                      {authority.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}