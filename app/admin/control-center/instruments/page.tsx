import ControlDomainSurface from "@/components/admin/control-center/ControlDomainSurface";
import Link from "next/link";

import { loadControlCenterInstrumentRegistry } from "@/domains/control-center/registries/loadControlCenterInstrumentRegistry";

export const dynamic = "force-dynamic";

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

export default async function ControlCenterInstrumentsPage() {
  const instruments = await loadControlCenterInstrumentRegistry();

  return (
    <ControlDomainSurface title="Institutional instrument registry" description="Canonical records and commercial editions. Each maintains its authority boundary." hideHeading
      rail={<nav aria-label="Institutional instrument registry index">
        <h2>Records · {instruments.length}</h2>
        {instruments.map((instrument) => <a key={instrument.reference} href={`#${encodeURIComponent("instrument-" + instrument.reference)}`}>
          <span className="mr-2 text-[9px] uppercase opacity-60">{instrument.family === "COMMERCIAL_EDITION" ? "SCO" : "INST"}</span>{instrument.reference}
        </a>)}
        {instruments.length === 0 ? <p className="text-xs text-neutral-400">No records listed.</p> : null}
      </nav>}>



      <section className="mt-6 overflow-hidden rounded-lg border border-stone-800">
        <div className="border-b border-stone-800 bg-black/20 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-stone-500">
            Federated documentary records · {instruments.length}
          </p>
        </div>

        {instruments.length === 0 ? (
          <div className="p-5 text-sm text-stone-500">
            No institutional instruments are registered.
          </div>
        ) : (
          instruments.map((instrument) => (
            <article
              key={instrument.reference}
              id={"instrument-" + instrument.reference}
              className="border-b border-stone-800 p-5 last:border-b-0"
            >
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p className="font-mono text-xs text-amber-300">
                      {instrument.reference}
                    </p>

                    <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500">
                      {instrument.family === "COMMERCIAL_EDITION" ? "Commercial edition" : "Institutional instrument"} · v{instrument.currentVersion}
                    </p>
                  </div>

                  <h2 className="mt-2 text-base font-medium text-white">
                    {instrument.title}
                  </h2>

                  <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                    <div>
                      <p className="text-stone-600">Kind</p>
                      <p className="mt-1 text-stone-300">
                        {humanize(instrument.kind)}
                      </p>
                    </div>

                    <div>
                      <p className="text-stone-600">Instrument status</p>
                      <p className="mt-1 text-stone-300">
                        {humanize(instrument.status)}
                      </p>
                    </div>

                    <div>
                      <p className="text-stone-600">Domain state</p>
                      <p className="mt-1 text-stone-300">
                        {instrument.domainState
                          ? humanize(instrument.domainState)
                          : "No Control Center operator surface"}
                      </p>
                    </div>
                  </div>

                  {instrument.counterpartyName ? (
                    <p className="mt-4 text-xs text-stone-500">
                      Counterparty ·{" "}
                      <span className="text-stone-300">
                        {instrument.counterpartyName}
                      </span>
                    </p>
                  ) : null}
                </div>

                {instrument.operatorHref ? (
                  <Link
                    href={instrument.operatorHref}
                    className="inline-flex border border-stone-700 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-stone-300 transition hover:border-amber-700 hover:text-amber-300"
                  >
                    {instrument.family === "COMMERCIAL_EDITION" ? "Review frozen editions" : "Open instrument"}
                  </Link>
                ) : (
                  <span className="text-[10px] uppercase tracking-[0.12em] text-stone-600">
                    Registry record
                  </span>
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </ControlDomainSurface>
  );
}
