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
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-wide text-neutral-500">
              <span>
                Source {sourceOpportunity.source}
              </span>

              {sourceIntake ? (
                <>
                  <span className="text-neutral-700">·</span>

                  <a
                    href={`/admin/transaction-intakes/${sourceIntake.id}`}
                    className="text-emerald-300 hover:text-emerald-200"
                  >
                    Intake {sourceIntake.reference}
                  </a>

                  {sourceIntake.referralCode ? (
                    <>
                      <span className="text-neutral-700">·</span>
                      <span>
                        Ref {sourceIntake.referralCode}
                      </span>
                    </>
                  ) : null}

                  {sourceIntake.referredByName ? (
                    <>
                      <span className="text-neutral-700">·</span>
                      <span>
                        By {sourceIntake.referredByName}
                      </span>
                    </>
                  ) : null}

                  {sourceIntake.promotedBy ? (
                    <>
                      <span className="text-neutral-700">·</span>
                      <span>
                        Promoted by {sourceIntake.promotedBy}
                      </span>
                    </>
                  ) : null}
                </>
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
