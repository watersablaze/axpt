import ControlDomainSurface from "@/components/admin/control-center/ControlDomainSurface";
import Link from "next/link";

import { loadControlCenterInstrumentRegistry } from "@/domains/control-center/registries/loadControlCenterInstrumentRegistry";

export const dynamic = "force-dynamic";

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

type InstrumentRegistryRecord = Awaited<
  ReturnType<typeof loadControlCenterInstrumentRegistry>
>[number];

type InstrumentCategoryKey =
  | "representation"
  | "source-authority"
  | "custodial-frameworks"
  | "settlement"
  | "other";

type InstrumentCategory = {
  key: InstrumentCategoryKey;
  label: string;
  description: string;
};

const instrumentCategories: readonly InstrumentCategory[] = [
  {
    key: "representation",
    label: "Representation & Appointment",
    description: "Appointment, agreement and delegated-representation instruments.",
  },
  {
    key: "source-authority",
    label: "Source Authority",
    description: "Instruments establishing source, custodial provenance or originating authority.",
  },
  {
    key: "custodial-frameworks",
    label: "Custodial & Constitutional Frameworks",
    description: "Institutional frameworks governing custodianship, constitutional alignment and deliberation.",
  },
  {
    key: "settlement",
    label: "Settlement & Transaction Instruments",
    description: "Instruments governing transaction-specific settlement, authorization and value movement.",
  },
  {
    key: "other",
    label: "Other Institutional Instruments",
    description: "Registered instruments awaiting a more specific institutional classification.",
  },
] as const;

function resolveInstrumentCategory(
  instrument: InstrumentRegistryRecord,
): InstrumentCategoryKey {
  if (
    instrument.reference === "FWI-26-RP-001-APPT-001" ||
    instrument.reference.startsWith("FWI-26-RP-ONB-") ||
    instrument.kind === "REPRESENTATIVE_APPOINTMENT" ||
    instrument.kind === "REPRESENTATIVE_PROGRAM_AGREEMENT"
  ) {
    return "representation";
  }

  if (
    instrument.reference === "BAF-SAI-2026-001" ||
    instrument.kind === "SOURCE_AUTHORITY"
  ) {
    return "source-authority";
  }

  if (
    instrument.reference === "GM-KENYA-RCF-001" ||
    instrument.kind === "ROYAL_CUSTODIAL_FRAMEWORK"
  ) {
    return "custodial-frameworks";
  }

  if (
    instrument.reference.startsWith("FW-DSI-") ||
    instrument.kind === "DIGITAL_SETTLEMENT_INSTRUMENT"
  ) {
    return "settlement";
  }

  return "other";
}

export default async function ControlCenterInstrumentsPage() {
  const instruments = await loadControlCenterInstrumentRegistry();

  const grouped = new Map<
    InstrumentCategoryKey,
    InstrumentRegistryRecord[]
  >(
    instrumentCategories.map((category) => [category.key, []]),
  );

  for (const instrument of instruments) {
    grouped.get(resolveInstrumentCategory(instrument))?.push(instrument);
  }

  const populatedCategories = instrumentCategories.filter(
    (category) => (grouped.get(category.key)?.length ?? 0) > 0,
  );

  return (
    <ControlDomainSurface
      title="Institutional instrument registry"
      description="Canonical institutional records. Each instrument retains its own authority boundary."
      showHeading={false}
      rail={
        <nav aria-label="Institutional instrument registry index">
          <h2>Records · {instruments.length}</h2>

          {populatedCategories.map((category) => {
            const records = grouped.get(category.key) ?? [];

            return (
              <details
                key={category.key}
                open
                className="group mt-3 border-t border-white/[0.08] pt-3 first:mt-3"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-[9px] uppercase tracking-[0.12em] text-stone-400 [&::-webkit-details-marker]:hidden">
                  <a
                    href={`#${category.key}`}
                    className="min-w-0 flex-1 leading-4 transition hover:text-white"
                  >
                    {category.label}
                  </a>

                  <span className="flex shrink-0 items-center gap-2 text-stone-600">
                    <span>{records.length}</span>
                    <span
                      aria-hidden="true"
                      className="text-[11px] leading-none transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </span>
                </summary>

                <div className="mt-1.5">
                  {records.map((instrument) => (
                    <a
                      key={instrument.reference}
                      href={`#${encodeURIComponent(
                        "instrument-" + instrument.reference,
                      )}`}
                      className="block border-b border-white/[0.05] py-2 font-mono text-[9px] leading-4 text-stone-400 transition hover:text-white"
                    >
                      {instrument.reference}
                    </a>
                  ))}
                </div>
              </details>
            );
          })}

          {instruments.length === 0 ? (
            <p className="text-xs text-neutral-400">No records listed.</p>
          ) : null}
        </nav>
      }
    >
      {instruments.length === 0 ? (
        <section className="mt-6 border border-stone-800 p-5 text-sm text-stone-500">
          No institutional instruments are registered.
        </section>
      ) : (
        <div className="space-y-5 pb-6">
          {populatedCategories.map((category) => {
            const records = grouped.get(category.key) ?? [];

            return (
              <details
                key={category.key}
                id={category.key}
                open
                className="group scroll-mt-6"
              >
                <summary className="mb-2.5 cursor-pointer list-none border-y border-stone-800 bg-black/15 px-3.5 py-2.5 [&::-webkit-details-marker]:hidden">
                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-5 gap-y-1">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <h2
                          className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-200"
                        >
                          {category.label}
                        </h2>

                        <span
                          aria-hidden="true"
                          className="text-[12px] leading-none text-stone-600 transition-transform group-open:rotate-45"
                        >
                          +
                        </span>
                      </div>

                      <p className="mt-0.5 max-w-3xl text-[10px] leading-4 text-stone-500">
                        {category.description}
                      </p>
                    </div>

                    <span className="shrink-0 text-[9px] uppercase tracking-[0.14em] text-stone-600">
                      Records · {records.length}
                    </span>
                  </div>
                </summary>

                <div className="overflow-hidden rounded-md border border-stone-800">
                  {records.map((instrument) => (
                    <article
                      key={instrument.reference}
                      id={"instrument-" + instrument.reference}
                      className="border-b border-stone-800 px-4 py-3.5 last:border-b-0"
                    >
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <p className="font-mono text-xs text-amber-300">
                              {instrument.reference}
                            </p>

                            <p className="text-[10px] uppercase tracking-[0.12em] text-stone-600">
                              v{instrument.currentVersion}
                            </p>
                          </div>

                          <h3 className="mt-1.5 text-[15px] font-medium leading-5 text-white">
                            {instrument.title}
                          </h3>

                          <div className="mt-3 grid gap-x-5 gap-y-2 text-[11px] sm:grid-cols-3">
                            <div>
                              <p className="text-stone-600">Kind</p>
                              <p className="mt-1 text-stone-300">
                                {humanize(instrument.kind)}
                              </p>
                            </div>

                            <div>
                              <p className="text-stone-600">
                                Instrument status
                              </p>
                              <p className="mt-1 text-stone-300">
                                {humanize(instrument.status)}
                              </p>
                            </div>

                            <div>
                              <p className="text-stone-600">
                                Domain state
                              </p>
                              <p className="mt-1 text-stone-300">
                                {instrument.domainState
                                  ? humanize(instrument.domainState)
                                  : "No Control Center operator surface"}
                              </p>
                            </div>
                          </div>

                          {instrument.counterpartyName ? (
                            <p className="mt-3 text-[11px] text-stone-500">
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
                            className="inline-flex border border-stone-700 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.14em] text-stone-300 transition hover:border-amber-700 hover:text-amber-300"
                          >
                            Open instrument
                          </Link>
                        ) : (
                          <span className="text-[10px] uppercase tracking-[0.12em] text-stone-600">
                            Registry record
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </ControlDomainSurface>
  );
}
