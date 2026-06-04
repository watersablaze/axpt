'use client'

import type {
  ControlCenterDossier,
} from '@/hooks/useControlCenterOperationalState'

type Props = {
  gate?: ControlCenterDossier['artifactGate']
}

function gateTone(passed: boolean) {
  return passed
    ? 'border-emerald-900 bg-emerald-950/20 text-emerald-300'
    : 'border-orange-900 bg-orange-950/20 text-orange-300'
}

export default function DossierArtifactGatePanel({
  gate,
}: Props) {
  const checks =
    gate?.checks ?? []

  const blockingCount =
    checks.filter(
      (check) => !check.passed
    ).length

  return (
    <div className="rounded-lg border border-neutral-800 bg-black/20 p-3 text-xs">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            Artifact Gates
          </div>

          <div className="mt-1 text-sm font-medium text-white">
            Execution Readiness
          </div>
        </div>

        <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
          {blockingCount} Blocking
        </div>
      </div>

      {checks.length === 0 ? (
        <div className="mt-3 rounded border border-neutral-800 bg-black/30 p-2 text-neutral-500">
          No active artifact checks.
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {checks.map((check) => (
            <div
              key={check.id}
              className={`rounded border p-2 ${gateTone(
                check.passed
              )}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">
                  {check.passed ? '✓' : '✗'}{' '}
                  {check.label}
                </span>

                <span className="text-[10px] uppercase tracking-wide opacity-70">
                  {check.passed
                    ? 'Ready'
                    : 'Required'}
                </span>
              </div>

              {check.detail ? (
                <div className="mt-1 text-[11px] text-neutral-400">
                  {check.detail}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}