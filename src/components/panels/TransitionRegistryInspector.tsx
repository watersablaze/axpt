'use client'

type RegistryIssue = {
  transitionKey: string
  severity: 'WARNING' | 'CRITICAL'
  message: string
}

type RegistryTransition = {
  transitionKey: string
  fromState: string
  toState: string
  requiredApprovals: Array<{
    requiredRole: string
    requiredCount: number
  }>
  generatedArtifacts: Array<{
    type: string
    title: string
    status: string
    version: string
  }>
  consequences: Array<{
    type: string
    label: string
    detail: string
    severity: 'INFO' | 'WARNING' | 'CRITICAL'
  }>
}

type Props = {
  registry?: {
    ok: boolean
    issues: RegistryIssue[]
    transitions: RegistryTransition[]
  } | null
}

function statusTone(ok: boolean) {
  return ok
    ? 'border-emerald-900 bg-emerald-950/20 text-emerald-300'
    : 'border-red-900 bg-red-950/20 text-red-300'
}

export default function TransitionRegistryInspector({
  registry,
}: Props) {
  const transitions =
    registry?.transitions ?? []

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Transition Registry
          </div>

          <h2 className="mt-1 text-lg font-medium text-white">
            Institutional Rule Map
          </h2>
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${statusTone(
            registry?.ok ?? false
          )}`}
        >
          {registry?.ok ? 'Valid' : 'Needs Review'}
        </div>
      </div>

      {registry?.issues?.length ? (
        <div className="mb-3 space-y-1 rounded border border-orange-900 bg-orange-950/10 p-2">
          {registry.issues.map((issue) => (
            <div
              key={`${issue.transitionKey}-${issue.message}`}
              className="text-[11px] text-orange-300"
            >
              {issue.severity}: {issue.transitionKey} — {issue.message}
            </div>
          ))}
        </div>
      ) : null}

      {transitions.length === 0 ? (
        <div className="rounded border border-neutral-800 bg-black/30 p-2 text-xs text-neutral-500">
          No registered transitions.
        </div>
      ) : (
        <div className="space-y-2">
          {transitions.map((transition) => (
            <div
              key={transition.transitionKey}
              className="rounded-lg border border-neutral-800 bg-black/20 p-3 text-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-cyan-300">
                    {transition.transitionKey}
                  </div>

                  <div className="mt-1 text-sm font-medium text-white">
                    {transition.fromState} → {transition.toState}
                  </div>
                </div>

                <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
                  Registered
                </div>
              </div>

              <div className="mt-3 grid gap-2">
                <div className="rounded border border-neutral-800 bg-black/30 p-2">
                  <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                    Required Approvals
                  </div>

                  {transition.requiredApprovals.length > 0 ? (
                    <div className="mt-1 space-y-1">
                      {transition.requiredApprovals.map((approval) => (
                        <div
                          key={`${approval.requiredRole}-${approval.requiredCount}`}
                          className="text-neutral-300"
                        >
                          ✓ {approval.requiredRole} × {approval.requiredCount}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 text-neutral-500">
                      No approval requirement.
                    </div>
                  )}
                </div>

                <div className="rounded border border-neutral-800 bg-black/30 p-2">
                  <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                    Generated Artifacts
                  </div>

                  {transition.generatedArtifacts.length > 0 ? (
                    <div className="mt-1 space-y-1">
                      {transition.generatedArtifacts.map((artifact) => (
                        <div
                          key={`${artifact.type}-${artifact.version}`}
                          className="rounded border border-neutral-800 bg-black/20 px-2 py-1"
                        >
                          <div className="text-neutral-300">
                            {artifact.title}
                          </div>

                          <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                            {artifact.type} · {artifact.status} ·{' '}
                            {artifact.version}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 text-neutral-500">
                      No generated artifacts.
                    </div>
                  )}
                </div>

                <div className="rounded border border-neutral-800 bg-black/30 p-2">
                  <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                    Consequences
                  </div>

                  {transition.consequences.length > 0 ? (
                    <div className="mt-1 space-y-1">
                      {transition.consequences.map((item) => (
                        <div
                          key={`${item.type}-${item.label}`}
                          className="text-neutral-400"
                        >
                          ✓ {item.label}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 text-neutral-500">
                      No declared consequences.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}