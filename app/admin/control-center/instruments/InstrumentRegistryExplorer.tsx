"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ControlDomainSurface from "@/components/admin/control-center/ControlDomainSurface";

export type DirectoryInstrument = Readonly<{
  reference: string;
  kind: string;
  title: string;
  status: string;
  currentVersion: number;
  domainState: string | null;
  counterpartyName: string | null;
  operatorHref: string | null;
}>;

type Family = "representation" | "source" | "constitutional" | "settlement" | "other";
type Collection = "all" | "eco-nommo" | "elsewhere";
const FAMILIES: readonly { key: Family; label: string; description: string }[] = [
  { key: "representation", label: "Representation & Appointment", description: "Representative appointments, agreements, and mandates" },
  { key: "source", label: "Source Authority", description: "Documentary source authority and provenance" },
  { key: "constitutional", label: "Custodial & Constitutional Frameworks", description: "Custodianship, constitutions, and deliberation" },
  { key: "settlement", label: "Settlement & Transaction Instruments", description: "Transaction-specific settlement and authorization" },
  { key: "other", label: "Other Institutional Instruments", description: "Other records within the existing institutional registry" },
];

const isEcoNommoReference = (reference: string) => /^(?:EN-\d{2}(?:$|-)|ECN-)/.test(reference);
const humanize = (value: string) => value.replace(/_/g, " ");

function familyOf(record: DirectoryInstrument): Family {
  if (record.reference === "FWI-26-RP-001-APPT-001" ||
      record.reference.startsWith("FWI-26-RP-ONB-") ||
      record.kind === "REPRESENTATIVE_APPOINTMENT" ||
      record.kind === "REPRESENTATIVE_PROGRAM_AGREEMENT") return "representation";
  if (record.reference === "BAF-SAI-2026-001" || record.kind === "SOURCE_AUTHORITY") return "source";
  if (record.reference === "GM-KENYA-RCF-001" ||
      record.kind === "ROYAL_CUSTODIAL_FRAMEWORK" ||
      isEcoNommoReference(record.reference)) return "constitutional";
  if (record.reference.startsWith("FW-DSI-") ||
      record.kind === "DIGITAL_SETTLEMENT_INSTRUCTION" ||
      record.kind === "DIGITAL_SETTLEMENT_INSTRUMENT") return "settlement";
  return "other";
}

export default function InstrumentRegistryExplorer({ records }: { records: readonly DirectoryInstrument[] }) {
  const [search, setSearch] = useState("");
  const [collection, setCollection] = useState<Collection>("all");
  const [family, setFamily] = useState<Family | "all">("all");
  const [expandedReference, setExpandedReference] = useState<string | null>(null);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return records.filter((record) => {
      const isEco = isEcoNommoReference(record.reference);
      if (collection === "eco-nommo" && !isEco) return false;
      if (collection === "elsewhere" && isEco) return false;
      if (family !== "all" && familyOf(record) !== family) return false;
      return !needle || [record.reference, record.title, record.kind, record.status,
        record.domainState ?? "", record.counterpartyName ?? ""]
        .some((value) => value.toLocaleLowerCase().includes(needle));
    });
  }, [records, search, collection, family]);
  const grouped = FAMILIES.map((entry) => ({
    ...entry, records: filtered.filter((record) => familyOf(record) === entry.key),
  })).filter((entry) => entry.records.length > 0);
  const familyCounts = FAMILIES.map((item) => ({
    ...item,
    count: records.filter((record) =>
      (collection === "all" ||
        (collection === "eco-nommo" ? isEcoNommoReference(record.reference) : !isEcoNommoReference(record.reference))) &&
      (!search.trim() || [record.reference, record.title, record.kind, record.status,
        record.domainState ?? "", record.counterpartyName ?? ""]
        .some((value) => value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))) &&
      familyOf(record) === item.key,
    ).length,
  }));
  const reset = () => { setSearch(""); setCollection("all"); setFamily("all"); setExpandedReference(null); };

  return (
    <ControlDomainSurface
      title="Institutional instrument registry"
      description="Canonical institutional records. Each instrument retains its own authority boundary."
      showHeading={false}
      rail={
        <nav aria-label="Instrument family navigation">
          <h2>Browse instruments · {records.length}</h2>
          <button type="button" aria-pressed={family === "all"}
            onClick={() => setFamily("all")}
            className={`w-full rounded px-2 py-2 text-left text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 ${family === "all" ? "bg-cyan-900/20 text-cyan-100" : "text-slate-300 hover:bg-white/5"}`}>
            All instrument families <span className="float-right tabular-nums">{familyCounts.reduce((sum, item) => sum + item.count, 0)}</span>
          </button>
          {familyCounts.map((item) => (
            <button key={item.key} type="button" aria-pressed={family === item.key}
              onClick={() => setFamily(item.key)}
              className={`w-full rounded px-2 py-2 text-left text-xs leading-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 ${family === item.key ? "bg-cyan-900/20 text-cyan-100" : "text-slate-300 hover:bg-white/5"}`}>
              <span className="flex items-start justify-between gap-2">
                <span>{item.label}</span><span className="tabular-nums text-slate-400">{item.count}</span>
              </span>
            </button>
          ))}
          <p className="pt-3 text-[11px] leading-5 text-slate-500">Counts respect search and collection filters. Specialist workspaces retain their own authority.</p>
        </nav>
      }
    >
      <section className="space-y-5" aria-label="Institutional instrument directory">
        <div className="rounded-lg border border-slate-700/60 bg-black/10 p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <label htmlFor="instrument-search" className="mb-1 block text-xs text-slate-300">Find instrument</label>
              <input id="instrument-search" type="search" value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Reference, title, status, counterparty"
                className="w-full rounded border border-slate-700 bg-[#0c151d] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300" />
            </div>
            <div>
              <label htmlFor="instrument-collection" className="mb-1 block text-xs text-slate-300">Collection</label>
              <select id="instrument-collection" value={collection}
                onChange={(event) => setCollection(event.target.value as Collection)}
                className="w-full rounded border border-slate-700 bg-[#0c151d] px-3 py-2 text-sm text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
                <option value="all">All registered records</option>
                <option value="eco-nommo">Eco-Nommo references</option>
                <option value="elsewhere">Other references</option>
              </select>
            </div>
            <div>
              <label htmlFor="instrument-family" className="mb-1 block text-xs text-slate-300">Instrument family</label>
              <select id="instrument-family" value={family}
                onChange={(event) => setFamily(event.target.value as Family | "all")}
                className="w-full rounded border border-slate-700 bg-[#0c151d] px-3 py-2 text-sm text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
                <option value="all">All families</option>
                {FAMILIES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" aria-atomic="true" className="text-xs text-slate-400">
              {filtered.length} of {records.length} registered {records.length === 1 ? "record" : "records"}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <fieldset className="flex items-center gap-1 rounded border border-slate-700 p-1">
                <legend className="sr-only">Record display density</legend>
                <button type="button" aria-pressed={density === "comfortable"} onClick={() => setDensity("comfortable")}
                  className={`rounded px-2 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 ${density === "comfortable" ? "bg-slate-700 text-white" : "text-slate-400"}`}>Detailed</button>
                <button type="button" aria-pressed={density === "compact"} onClick={() => setDensity("compact")}
                  className={`rounded px-2 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 ${density === "compact" ? "bg-slate-700 text-white" : "text-slate-400"}`}>Compact</button>
              </fieldset>
              {(search || collection !== "all" || family !== "all") && (
                <button type="button" onClick={reset}
                  className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">Clear filters</button>
              )}
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Eco-Nommo collection recognition is provisional and reference-based, not proof of institutional ownership or legal effect.</p>
        </div>
        {grouped.length === 0 && (
          <div role="status" className="rounded border border-slate-700 p-6">
            <p className="text-sm text-slate-200">No registered instruments match these filters.</p>
            <p className="mt-2 text-xs text-slate-400">Unregistered Eco-Nommo drafts and manifests are not displayed as live records.</p>
          </div>
        )}
        {grouped.map((group) => (
          <section key={group.key} aria-label={group.label} className="overflow-hidden rounded-lg border border-slate-700/60">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 bg-black/20 px-4 py-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">{group.label}</h2>
                <p className="mt-1 text-xs text-slate-500">{group.description}</p>
              </div>
              <span className="text-xs text-slate-500">{group.records.length} {group.records.length === 1 ? "record" : "records"}</span>
            </header>
            {group.records.map((record) => {
              const expanded = expandedReference === record.reference;
              const panelId = "instrument-detail-" + record.reference.replace(/[^a-zA-Z0-9-]/g, "-");
              return (
                <article key={record.reference} className={`border-b border-slate-700/50 px-4 last:border-b-0 ${density === "compact" ? "py-2.5" : "py-4"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-amber-300">{record.reference} <span className="ml-2 text-slate-500">V{record.currentVersion}</span></p>
                      <h3 className="mt-1 text-sm font-medium text-white">{record.title}</h3>
                    </div>
                    <button type="button" aria-expanded={expanded} aria-controls={panelId}
                      onClick={() => setExpandedReference(expanded ? null : record.reference)}
                      aria-label={`${expanded ? "Close" : "Show"} details for ${record.title}, ${record.reference}`}
                      className="rounded border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
                      {expanded ? "Close details" : "Record details"}
                    </button>
                  </div>
                  <div className={`grid gap-x-3 text-xs sm:grid-cols-3 ${density === "compact" ? "mt-2 gap-y-1" : "mt-3 gap-y-3"}`}>
                    {density === "comfortable" && <div><p className="text-slate-500">Kind</p><p className="mt-1 text-slate-200">{humanize(record.kind)}</p></div>}
                    <div><p className={density === "compact" ? "sr-only" : "text-slate-500"}>Record status</p><p className={density === "compact" ? "text-slate-300" : "mt-1 text-slate-200"}>{humanize(record.status)}</p></div>
                    {density === "comfortable" && <div><p className="text-slate-500">Domain state</p><p className="mt-1 text-slate-200">{record.domainState ? humanize(record.domainState) : "No operator surface"}</p></div>}
                  </div>
                  {expanded && <div id={panelId} role="region" aria-label={`Details for ${record.reference}`} className="mt-4 space-y-2 rounded border border-slate-700/50 bg-black/20 p-4 text-xs text-slate-300">
                    <p><span className="text-slate-500">Reference: </span>{record.reference}</p>
                    <p><span className="text-slate-500">Current version: </span>V{record.currentVersion}; edition history is not exposed by this read model.</p>
                    <p><span className="text-slate-500">Counterparty: </span>{record.counterpartyName ?? "Not specified"}</p>
                    <p className="text-slate-500">Registry status alone does not establish legal execution, custody, or financial activation.</p>
                    {record.operatorHref ? <Link href={record.operatorHref}
                      className="inline-block rounded border border-slate-600 px-3 py-2 text-xs text-white hover:bg-white/5">Open existing operator workspace</Link>
                      : <p className="text-slate-500">No specialized operator workspace linked.</p>}
                  </div>}
                </article>
              );
            })}
          </section>
        ))}
      </section>
    </ControlDomainSurface>
  );
}
