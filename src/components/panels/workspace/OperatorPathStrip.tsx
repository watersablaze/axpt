"use client";

type WorkspaceTab = "OVERVIEW" | "EXECUTION" | "DOCUMENTS" | "TIMELINE";

type Props = {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
};

export function OperatorPathStrip({ activeTab, onSelectTab }: Props) {
  const steps: Array<{
    label: string;
    tab: WorkspaceTab;
    description: string;
  }> = [
    {
      label: "Brief",
      tab: "OVERVIEW",
      description: "Origin, parties, terms, and dossier readiness.",
    },
    {
      label: "Execution",
      tab: "EXECUTION",
      description: "State movement, gates, and operator action.",
    },
    {
      label: "Drafts",
      tab: "DOCUMENTS",
      description: "Data readiness, instruments, previews, and artifacts.",
    },
    {
      label: "Timeline",
      tab: "TIMELINE",
      description: "Audit trail, events, and dossier movement history.",
    },
  ];

  return (
    <div className="rounded-xl border border-neutral-800 bg-black/25 p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            Operator Path
          </div>

          <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
            Follow the dossier from brief to execution, drafts, and audit trail.
          </p>
        </div>

        <div className="hidden rounded border border-neutral-800 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-500 md:block">
          Workspace Spine
        </div>
      </div>

      <div className="mt-2 grid gap-1 md:grid-cols-4">
        {steps.map((step, index) => {
          const active = activeTab === step.tab;

          return (
            <button
              key={step.tab}
              type="button"
              onClick={() => onSelectTab(step.tab)}
              className={`rounded border px-3 py-2 text-left transition ${
                active
                  ? "border-cyan-800 bg-cyan-950/20 text-cyan-200"
                  : "border-neutral-800 bg-black/20 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] uppercase tracking-wide">
                  {index + 1}. {step.label}
                </div>

                {active ? (
                  <span className="rounded border border-cyan-800 px-2 py-0.5 text-[9px] uppercase tracking-wide text-cyan-300">
                    Active
                  </span>
                ) : null}
              </div>

              <p className="mt-1 text-[10px] leading-relaxed opacity-70">
                {step.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
