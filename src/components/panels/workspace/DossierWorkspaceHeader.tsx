'use client'

type Props = {
  reference: string
  title: string
  state: string
}

export default function DossierWorkspaceHeader({
  reference,
  title,
  state,
}: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-black/30 p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        Dossier Flight Deck
      </div>

      <div className="mt-2 flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            {reference}
          </div>

          <h2 className="mt-1 text-lg font-medium text-white">
            {title}
          </h2>
        </div>

        <div className="rounded border border-cyan-900 bg-cyan-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-cyan-300">
          {state}
        </div>
      </div>
    </div>
  )
}
