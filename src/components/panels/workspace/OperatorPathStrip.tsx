"use client";

type WorkspaceTab = "OVERVIEW" | "EXECUTION" | "DOCUMENTS" | "TIMELINE";

const sections = [
  { label: "Brief", tab: "OVERVIEW" },
  { label: "Execution", tab: "EXECUTION" },
  { label: "Readiness", tab: "DOCUMENTS" },
  { label: "Timeline", tab: "TIMELINE" },
] as const;

export function OperatorPathStrip({
  activeTab,
  onSelectTab,
}: {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
}) {
  return (
    <nav aria-label="Dossier sections" className="flex flex-wrap gap-1 border-b border-neutral-800 pb-2">
      {sections.map(({ label, tab }) => (
        <button
          key={tab}
          type="button"
          aria-pressed={activeTab === tab}
          onClick={() => onSelectTab(tab)}
          className={`rounded border px-3 py-1.5 text-xs ${
            activeTab === tab
              ? "border-cyan-800 bg-cyan-950/30 text-cyan-200"
              : "border-transparent text-neutral-400 hover:text-neutral-100"
          }`}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
