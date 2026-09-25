import Link from "next/link";
import { notFound } from "next/navigation";

import DigitalSettlementOperatorPage from "../../instruments/digital-settlement/[reference]/page";
import {
  INDERAKSH_TRANSACTION_CONTINUITY,
  INDERAKSH_TRANSACTION_REFERENCE,
} from "@/domains/instruments/definitions/inderakshTransactionContinuity";
import { DSI_REFERENCE } from "@/domains/instruments/definitions/digitalSettlementV1Definition";

export const dynamic = "force-dynamic";

const views = [
  ["overview", "Overview"],
  ["documents", "Documents"],
  ["settlement", "Settlement Control"],
  ["access", "Access & Communications"],
  ["evidence", "Evidence / Reconciliation"],
  ["history", "History"],
] as const;

type Props = {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ view?: string }>;
};

export default async function TransactionOperatorPage({
  params,
  searchParams,
}: Props) {
  const { reference } = await params;

  if (reference !== INDERAKSH_TRANSACTION_REFERENCE) {
    notFound();
  }

  const requested = (await searchParams).view;
  const view = views.find(([key]) => key === requested)?.[0] ?? "overview";
  const path = `/admin/control-center/transactions/${reference}`;

  const documents =
    INDERAKSH_TRANSACTION_CONTINUITY.governingDocuments.filter(
      (item) => item.kind !== "DSI",
    );

  return (
    <div className="min-h-screen bg-[#090d0c] text-stone-100">
      <header className="sticky top-0 z-30 border-b border-stone-800 bg-[#090d0c]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-amber-300">
                French-Ward · Transaction Control
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 className="font-mono text-sm text-white sm:text-base">
                  {reference}
                </h1>
                <span className="text-xs text-stone-400">
                  Inderaksh Gold Refinery FZ-LLC · Initial 50 KG
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.12em]">
              <span className="text-amber-300">Documents · Issued</span>
              <span className="text-stone-300">Execution · Awaiting</span>
              <span className="text-cyan-300">Settlement · Active</span>
              <span className="text-rose-300">Authority · Verification only</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-0 px-4 pb-12 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
        <aside className="border-b border-stone-800 py-3 lg:sticky lg:top-[74px] lg:h-[calc(100vh-74px)] lg:border-b-0 lg:border-r lg:py-5">
          <nav
            aria-label="Operator transaction workspaces"
            className="flex gap-1 overflow-x-auto pr-0 lg:flex-col lg:overflow-visible lg:pr-4"
          >
            {views.map(([key, label]) => (
              <Link
                key={key}
                aria-current={view === key ? "page" : undefined}
                className={
                  view === key
                    ? "whitespace-nowrap border-l-2 border-amber-300 bg-amber-950/20 px-3 py-2 text-xs text-white"
                    : "whitespace-nowrap border-l-2 border-transparent px-3 py-2 text-xs text-stone-400 hover:bg-white/[0.03] hover:text-white"
                }
                href={`${path}?view=${key}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="mt-6 hidden border-t border-stone-800 pt-4 pr-4 text-[10px] leading-5 text-stone-500 lg:block">
            <p className="uppercase tracking-[0.14em] text-stone-600">
              Control doctrine
            </p>
            <p className="mt-2">
              Machine observes → operator recognizes → system records.
            </p>
          </div>
        </aside>

        <main className="min-w-0 py-5 lg:pl-6">
          {view === "overview" ? (
            <section className="space-y-4" aria-label="Transaction control overview">
              <div className="border-b border-stone-800 pb-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
                  Current action
                </p>
                <h2 className="mt-1 text-base font-medium text-white">
                  Confirm Buyer signing authority and obtain executed SPA + Commercial Schedule.
                </h2>
                <p className="mt-1 max-w-3xl text-xs leading-5 text-stone-500">
                  The DSI settlement layer remains independently active. Agreement execution and
                  settlement authority are intentionally separate states.
                </p>
              </div>

              <div className="grid gap-px overflow-hidden rounded-lg border border-stone-800 bg-stone-800 md:grid-cols-2 xl:grid-cols-4">
                <div className="bg-[#0d1210] p-4">
                  <p className="text-[10px] uppercase tracking-wide text-stone-500">Agreement</p>
                  <p className="mt-1 text-sm text-white">Awaiting execution</p>
                  <p className="mt-1 text-[11px] text-amber-300">Signatory confirmation required</p>
                </div>
                <div className="bg-[#0d1210] p-4">
                  <p className="text-[10px] uppercase tracking-wide text-stone-500">Documents</p>
                  <p className="mt-1 text-sm text-white">SPA + CP issued</p>
                  <p className="mt-1 text-[11px] text-stone-500">Private file authority pending</p>
                </div>
                <div className="bg-[#0d1210] p-4">
                  <p className="text-[10px] uppercase tracking-wide text-stone-500">Settlement</p>
                  <p className="mt-1 text-sm text-white">Active</p>
                  <p className="mt-1 text-[11px] text-cyan-300">Verification authority only</p>
                </div>
                <div className="bg-[#0d1210] p-4">
                  <p className="text-[10px] uppercase tracking-wide text-stone-500">DSI</p>
                  <p className="mt-1 font-mono text-sm text-white">{DSI_REFERENCE}</p>
                  <p className="mt-1 text-[11px] text-stone-500">Existing authority preserved</p>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
                <section className="rounded-lg border border-stone-800 bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-stone-500">
                    Transaction
                  </p>
                  <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                    <div>
                      <dt className="text-stone-500">Buyer / Seller</dt>
                      <dd className="mt-1 text-white">Inderaksh Gold Refinery FZ-LLC / French-Ward, Inc.</dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">Quantity / Corridor</dt>
                      <dd className="mt-1 text-white">50 KG · Mali → Dubai · CIP / Air Freight</dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">Pricing</dt>
                      <dd className="mt-1 text-white">18 Sep 2026 LBMA PM · less 10%</dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">Current transfer authority</dt>
                      <dd className="mt-1 text-white">Verification transfer only · 50 USDT</dd>
                    </div>
                  </dl>
                </section>

                <section className="rounded-lg border border-amber-900/50 bg-amber-950/10 p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-amber-400">
                    Attention
                  </p>
                  <p className="mt-2 text-sm text-white">Buyer Signatory Confirmation Required</p>
                  <p className="mt-2 text-xs leading-5 text-stone-400">
                    Corey Keller is identified as Vice President / Buyer Representative. Confirm
                    authority to execute or obtain the authorized alternate before execution.
                  </p>
                </section>
              </div>
            </section>
          ) : null}

          {view === "documents" ? (
            <section className="space-y-4" aria-label="Governing document control">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
                  Governing documents
                </p>
                <h2 className="mt-1 text-base font-medium text-white">
                  Issued transaction instruments
                </h2>
              </div>

              <div className="overflow-hidden rounded-lg border border-stone-800">
                {documents.map((item) => (
                  <article
                    key={item.reference}
                    className="grid gap-3 border-b border-stone-800 bg-black/20 p-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wide text-stone-500">{item.role}</p>
                      <h3 className="mt-1 text-sm text-white">{item.title}</h3>
                      <p className="mt-1 break-all font-mono text-[11px] text-stone-400">{item.reference}</p>
                    </div>
                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <div className="text-[10px] uppercase tracking-wide text-amber-300">
                        {item.publicationState} · {item.status}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {["View", "Download", "Record Executed Copy"].map((action) => (
                          <button
                            key={action}
                            type="button"
                            disabled
                            className="rounded border border-stone-800 px-3 py-1.5 text-[10px] uppercase tracking-wide text-stone-600 disabled:cursor-not-allowed"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="rounded border border-amber-900/40 bg-amber-950/10 p-3 text-xs leading-5 text-stone-400">
                File authority is fail-closed until the private document store is connected.
              </div>
            </section>
          ) : null}

          {view === "settlement" ? (
            <section aria-label="Settlement control">
              <DigitalSettlementOperatorPage
                params={Promise.resolve({ reference: DSI_REFERENCE })}
              />
            </section>
          ) : null}

          {view === "access" ? (
            <section className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
                Access & communications
              </p>
              <h2 className="text-base font-medium text-white">Existing access authority preserved</h2>
              <p className="max-w-3xl text-xs leading-5 text-stone-500">
                Use the established DSI operator surface for access reissue and communication review
                while transaction-level access aggregation is hardened.
              </p>
              <Link
                href={`/admin/control-center/instruments/digital-settlement/${DSI_REFERENCE}`}
                className="inline-flex rounded border border-stone-700 px-3 py-2 text-[10px] uppercase tracking-wide text-stone-300"
              >
                Open DSI operator surface
              </Link>
            </section>
          ) : null}

          {view === "evidence" ? (
            <section className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
                Evidence / reconciliation
              </p>
              <h2 className="text-base font-medium text-white">
                Observation, verification and recognition remain separate.
              </h2>
              <p className="max-w-3xl text-xs leading-5 text-stone-500">
                Use Settlement Control for the bounded observer, canonical chain evidence,
                operator recognition and TAP authorization.
              </p>
              <Link
                href={`${path}?view=settlement`}
                className="inline-flex rounded border border-cyan-900 px-3 py-2 text-[10px] uppercase tracking-wide text-cyan-300"
              >
                Open Settlement Control
              </Link>
            </section>
          ) : null}

          {view === "history" ? (
            <section className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">History</p>
              <h2 className="text-base font-medium text-white">Transaction event register</h2>
              <p className="max-w-3xl text-xs leading-5 text-stone-500">
                DSI history remains available on the established operator surface. Document execution
                events will join this workspace after the governed document record is connected.
              </p>
              <Link
                href={`/admin/control-center/instruments/digital-settlement/${DSI_REFERENCE}`}
                className="inline-flex rounded border border-stone-700 px-3 py-2 text-[10px] uppercase tracking-wide text-stone-300"
              >
                Open DSI operator surface
              </Link>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
