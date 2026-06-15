'use client'

type AuthorityStatus = 'ACTIVE' | 'PENDING' | 'LIMITED' | string

type OperatorAuthority = {
  status: AuthorityStatus
  detail: string
}

type OperatorIdentity = {
  roles: string[]
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

export default function OperatorAuthorityMatrixPanel({
  operator,
}: Props) {
  const items = operator?.authority
    ? [
        [
          'Transition Authority',
          operator.authority.transitionAuthority,
        ],
        [
          'Approval Authority',
          operator.authority.approvalAuthority,
        ],
        [
          'Incident Authority',
          operator.authority.incidentAuthority,
        ],
        [
          'Treasury Authority',
          operator.authority.treasuryAuthority,
        ],
        [
          'Artifact Authority',
          operator.authority.artifactAuthority,
        ],
      ] as const
    : []

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Operator Authority
          </div>

          <h2 className="mt-1 text-lg font-medium text-white">
            Authority Matrix
          </h2>
        </div>

        <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
          {items.length} Domains
        </div>
      </div>

      {!operator || items.length === 0 ? (
        <div className="rounded border border-neutral-800 bg-black/30 p-2 text-xs text-neutral-500">
          Authority matrix unavailable.
        </div>
      ) : (
        <div className="space-y-2 text-xs">
          {items.map(([label, authority]) => (
            <div
              key={label}
              className="rounded border border-neutral-800 bg-black/20 p-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-white">
                    {label}
                  </div>

                  <div className="mt-1 text-[11px] leading-snug text-neutral-500">
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

              {operator.roles.length > 0 ? (
                <div className="mt-2 border-t border-neutral-800 pt-2">
                  <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                    Source Roles
                  </div>

                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {operator.roles.map((role) => (
                      <span
                        key={`${label}-${role}`}
                        className="rounded border border-neutral-800 bg-black/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-neutral-400"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}