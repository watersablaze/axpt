'use client'

export type DossierWorkspaceTab =
  | 'OVERVIEW'
  | 'EXECUTION'
  | 'TIMELINE'
  | 'DOCUMENTS'

type Props = {
  activeTab: DossierWorkspaceTab
  onChange: (tab: DossierWorkspaceTab) => void
}

const tabs: DossierWorkspaceTab[] = [
  'OVERVIEW',
  'EXECUTION',
  'TIMELINE',
  'DOCUMENTS',
]

export default function DossierWorkspaceTabs({
  activeTab,
  onChange,
}: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-black/30 p-2">
      <div className="grid grid-cols-4 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={
              tab === activeTab
                ? 'rounded border border-cyan-900 bg-cyan-950/30 px-2 py-1.5 text-[10px] uppercase tracking-wide text-cyan-300'
                : 'rounded border border-neutral-800 bg-black/20 px-2 py-1.5 text-[10px] uppercase tracking-wide text-neutral-500 hover:text-neutral-300'
            }
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  )
}
