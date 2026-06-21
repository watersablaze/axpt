'use client'

type SourceOpportunity = {
  id: string
  title: string
  source: string
  status: string
  sourceIntake: {
    id: string
    reference: string
    referralCode: string | null
    referredByName: string | null
    referredByCompany: string | null
    submitterName: string
    submitterEmail: string
    promotedAt: string | null
    promotedBy: string | null
  } | null
}

type Props = {
  reference: string
  title: string
  state: string
  sourceOpportunity?: SourceOpportunity | null
}

function SourceBadge({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: string
  tone?: 'neutral' | 'emerald'
}) {
  const toneClass =
    tone === 'emerald'
      ? 'border-emerald-900 bg-emerald-950/20 text-emerald-300'
      : 'border-neutral-800 bg-black/30 text-neutral-400'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${toneClass}`}
    >
      <span className="text-neutral-600">{label}</span>
      <span>{value}</span>
    </span>
  )
}

export default function DossierWorkspaceHeader({
  reference,
  title,
  state,
  sourceOpportunity,
}: Props) {
  const sourceIntake =
    sourceOpportunity?.sourceIntake ?? null

  return (
    <div className="rounded-xl border border-neutral-800 bg-black/30 p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        Dossier Flight Deck
      </div>

      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            {reference}
          </div>

          <h2 className="mt-1 text-lg font-medium text-white">
            {title}
          </h2>

          {sourceOpportunity ? (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <SourceBadge
                  label="Source"
                  value={sourceOpportunity.source}
                />

                {sourceIntake ? (
                  <a
                    href={`/admin/transaction-intakes/${sourceIntake.id}`}
                    className="inline-flex items-center gap-1 rounded border border-emerald-900 bg-emerald-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-emerald-300 hover:border-emerald-700 hover:text-emerald-200"
                  >
                    <span className="text-neutral-600">
                      Intake
                    </span>
                    <span>{sourceIntake.reference}</span>
                  </a>
                ) : null}

                {sourceIntake?.referralCode ? (
                  <SourceBadge
                    label="Ref"
                    value={sourceIntake.referralCode}
                  />
                ) : null}

                {sourceIntake?.referredByName ? (
                  <SourceBadge
                    label="By"
                    value={sourceIntake.referredByName}
                  />
                ) : null}
              </div>

              {sourceIntake?.promotedBy ? (
                <div className="flex flex-wrap items-center gap-2">
                  <SourceBadge
                    label="Promoted By"
                    value={sourceIntake.promotedBy}
                    tone="emerald"
                  />

                  {sourceIntake.promotedAt ? (
                    <SourceBadge
                      label="At"
                      value={new Date(
                        sourceIntake.promotedAt
                      ).toLocaleString()}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="shrink-0 rounded border border-cyan-900 bg-cyan-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-cyan-300">
          {state}
        </div>
      </div>
    </div>
  )
}
