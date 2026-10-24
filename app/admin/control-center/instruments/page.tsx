import ControlDomainSurface from "@/components/admin/control-center/ControlDomainSurface";
import Link from "next/link";
import { loadControlCenterInstrumentRegistry, type ControlCenterInstrumentRegistryEntry } from "@/domains/control-center/registries/loadControlCenterInstrumentRegistry";

export const dynamic = "force-dynamic";

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

function RegistryRecord({ instrument }: { instrument: ControlCenterInstrumentRegistryEntry }) {
  return (
    <article id={"instrument-" + instrument.reference} className="border-b border-stone-800 p-5 last:border-b-0">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="font-mono text-xs text-amber-300">{instrument.reference}</p>
            <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500">
              {instrument.family === "COMMERCIAL_EDITION" ? "Commercial edition" : "Institutional instrument"} · v{instrument.currentVersion}
            </p>
          </div>
          <h2 className="mt-2 text-base font-medium text-white">{instrument.title}</h2>
          <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
            <div><p className="text-stone-600">Kind</p><p className="mt-1 text-stone-300">{humanize(instrument.kind)}</p></div>
            <div><p className="text-stone-600">Record status</p><p className="mt-1 text-stone-300">{humanize(instrument.status)}</p></div>
            <div><p className="text-stone-600">Domain state</p><p className="mt-1 text-stone-300">
              {instrument.domainState ? humanize(instrument.domainState) : "No Control Center operator surface"}
            </p></div>
          </div>
          {instrument.counterpartyName && (
            <p className="mt-4 text-xs text-stone-500">Counterparty · <span className="text-stone-300">{instrument.counterpartyName}</span></p>
          )}
        </div>
        {instrument.operatorHref ? (
          <Link href={instrument.operatorHref} className="inline-flex border border-stone-700 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-stone-300 transition hover:border-amber-700 hover:text-amber-300">
            {instrument.family === "COMMERCIAL_EDITION" ? "Review frozen editions" : "Open instrument"}
          </Link>
        ) : (
          <span className="text-[10px] uppercase tracking-[0.12em] text-stone-600">Registry record</span>
        )}
      </div>
    </article>
  );
}

export default async function ControlCenterInstrumentsPage() {
  const instruments = await loadControlCenterInstrumentRegistry();
  const institutional = instruments.filter(item => item.family === "INSTITUTIONAL_INSTRUMENT");
  const commercial = instruments.filter(item => item.family === "COMMERCIAL_EDITION");
  const groups = [
    { id: "institutional-records", label: "Institutional instruments", items: institutional },
    { id: "commercial-editions", label: "Commercial editions", items: commercial },
  ];

  return (
    <ControlDomainSurface title="Institutional instrument registry" description="Canonical records and commercial editions. Each maintains its authority boundary." hideHeading
      rail={<nav aria-label="Institutional instrument registry index">
        <h2>Records · {instruments.length}</h2>
        {groups.map(group => (
          <div key={group.id}>
            <a href={`#${group.id}`} className="font-semibold uppercase tracking-[0.08em]">{group.label} · {group.items.length}</a>
            {group.items.map(instrument => (
              <a key={instrument.reference} href={`#${encodeURIComponent("instrument-" + instrument.reference)}`}>
                <span className="mr-2 text-[9px] uppercase opacity-60">{instrument.family === "COMMERCIAL_EDITION" ? `V${instrument.currentVersion}` : "INST"}</span>
                {instrument.reference}
              </a>
            ))}
          </div>
        ))}
      </nav>}>
      {groups.map(group => (
        <section id={group.id} key={group.id} className="overflow-hidden rounded-lg border border-stone-800">
          <div className="border-b border-stone-800 bg-black/20 px-4 py-3">
            <h2 className="text-xs font-medium text-stone-300">{group.label} · {group.items.length}</h2>
            <p className="mt-1 text-[11px] text-stone-500">
              {group.id === "commercial-editions"
                ? "Commercial edition records retain their original candidate states; documentary recognition is not dispatch status."
                : "Institutional records retain their own authority, version, and operating states."}
            </p>
          </div>
          {group.items.length === 0
            ? <p className="p-5 text-sm text-stone-500">No records in this family.</p>
            : group.items.map(instrument => <RegistryRecord key={instrument.reference} instrument={instrument} />)}
        </section>
      ))}
    </ControlDomainSurface>
  );
}
