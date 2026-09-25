import Link from "next/link";
import { notFound } from "next/navigation";

import DigitalSettlementOperatorPage from "../../instruments/digital-settlement/[reference]/page";
import {
  INDERAKSH_TRANSACTION_CONTINUITY,
  INDERAKSH_TRANSACTION_REFERENCE,
} from "@/domains/instruments/definitions/inderakshTransactionContinuity";
import { DSI_REFERENCE } from "@/domains/instruments/definitions/digitalSettlementV1Definition";
import { prisma } from "@/infrastructure/db/prisma";

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

function formatStatus(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ") : "—";
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return value.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

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

  const instrument = await prisma.institutionalInstrument.findUnique({
    where: { reference: DSI_REFERENCE },
    include: {
      digitalSettlementInstruction: true,
      accessGrants: {
        orderBy: { issuedAt: "desc" },
        include: {
          instrumentVersion: {
            select: { number: true },
          },
        },
      },
    },
  });

  if (!instrument?.digitalSettlementInstruction) {
    notFound();
  }

  const settlement = instrument.digitalSettlementInstruction;

  const history = await prisma.domainEvent.findMany({
    where: { streamId: instrument.id },
    orderBy: { occurredAt: "desc" },
    take: 12,
    select: {
      id: true,
      eventType: true,
      occurredAt: true,
    },
  });

  const now = new Date();
  const activeGrants = instrument.accessGrants.filter(
    (grant) =>
      !grant.revokedAt &&
      (!grant.expiresAt || grant.expiresAt.getTime() > now.getTime()),
  );

  const currentAuthority =
    settlement.settlementStatus === "AWAITING_VERIFICATION_TRANSFER"
      ? `VERIFICATION ONLY · ${settlement.verificationAmountUsdt.toString()} USDT`
      : settlement.settlementStatus === "VERIFICATION_CONFIRMED"
        ? "TAP PAUSED · OPERATOR AUTHORIZATION REQUIRED"
        : settlement.settlementStatus === "AWAITING_TRANSFER"
          ? "TAP BALANCE AUTHORIZED"
          : settlement.settlementStatus === "CONFIRMED"
            ? "SETTLEMENT CONFIRMED"
            : "NO NEW TRANSFER AUTHORITY";

  const documents = INDERAKSH_TRANSACTION_CONTINUITY.governingDocuments.filter(
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
              <span className="text-cyan-300">
                Settlement · {formatStatus(settlement.settlementStatus)}
              </span>
              <span className="text-rose-300">
                Authority · {currentAuthority}
              </span>
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
                  <p className="mt-1 text-sm text-white">{formatStatus(settlement.settlementStatus)}</p>
                  <p className="mt-1 text-[11px] text-cyan-300">{currentAuthority}</p>
                </div>
                <div className="bg-[#0d1210] p-4">
                  <p className="text-[10px] uppercase tracking-wide text-stone-500">Access</p>
                  <p className="mt-1 text-sm text-white">{activeGrants.length} active grant{activeGrants.length === 1 ? "" : "s"}</p>
                  <p className="mt-1 text-[11px] text-stone-500">Current DSI V{instrument.currentVersion}</p>
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
                      <dt className="text-stone-500">Settlement instrument</dt>
                      <dd className="mt-1 font-mono text-white">{DSI_REFERENCE}</dd>
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
                      {"fileName" in item && item.fileName ? (
                        <p className="mt-1 break-all text-[11px] text-stone-600">{item.fileName}</p>
                      ) : null}
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
                File authority is intentionally fail-closed. The metadata is issued, but View,
                Download, replacement, and executed-copy recording remain unavailable until a
                durable private object store and governed attachment catalog are bound.
              </div>
            </section>
          ) : null}

          {view === "settlement" ? (
            <section aria-label="Settlement control">
              <div className="mb-4 grid gap-3 rounded-lg border border-cyan-900/40 bg-cyan-950/10 p-4 md:grid-cols-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-stone-500">DSI</p>
                  <p className="mt-1 font-mono text-xs text-white">{DSI_REFERENCE}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-stone-500">Settlement state</p>
                  <p className="mt-1 text-xs text-cyan-300">{formatStatus(settlement.settlementStatus)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-stone-500">Current authority</p>
                  <p className="mt-1 text-xs text-rose-300">{currentAuthority}</p>
                </div>
              </div>

              <DigitalSettlementOperatorPage
                params={Promise.resolve({ reference: DSI_REFERENCE })}
              />
            </section>
          ) : null}

          {view === "access" ? (
            <section className="space-y-4" aria-label="Access and communications">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
                  Access & communications
                </p>
                <h2 className="mt-1 text-base font-medium text-white">
                  Version-bound private access
                </h2>
                <p className="mt-1 max-w-3xl text-xs leading-5 text-stone-500">
                  Existing Buyer access remains attached to the issued DSI. No access URL or token
                  is exposed in this console.
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border border-stone-800">
                {instrument.accessGrants.map((grant) => {
                  const active =
                    !grant.revokedAt &&
                    (!grant.expiresAt || grant.expiresAt.getTime() > now.getTime());

                  return (
                    <div
                      key={grant.id}
                      className="grid gap-2 border-b border-stone-800 bg-black/20 p-4 last:border-b-0 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]"
                    >
                      <div>
                        <p className="text-xs text-white">{grant.recipientName ?? "Named recipient"}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wide text-stone-500">
                          {formatStatus(grant.recipientRole)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-stone-500">Access</p>
                        <p className="mt-1 text-xs text-white">{grant.accessLevel} · V{grant.instrumentVersion?.number ?? instrument.currentVersion}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-stone-500">State</p>
                        <p className={`mt-1 text-xs ${active ? "text-emerald-300" : "text-stone-500"}`}>
                          {active ? "ACTIVE" : grant.revokedAt ? "REVOKED" : "EXPIRED"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-stone-500">Last access</p>
                        <p className="mt-1 text-xs text-stone-300">{formatDate(grant.lastAccessAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/control-center/instruments/digital-settlement/${DSI_REFERENCE}/email-preview?version=${instrument.currentVersion}`}
                  className="rounded border border-stone-700 px-3 py-2 text-[10px] uppercase tracking-wide text-stone-300 hover:border-stone-500 hover:text-white"
                >
                  Review current communications
                </Link>
                <Link
                  href={`/admin/control-center/instruments/digital-settlement/${DSI_REFERENCE}`}
                  className="rounded border border-stone-700 px-3 py-2 text-[10px] uppercase tracking-wide text-stone-300 hover:border-stone-500 hover:text-white"
                >
                  Open legacy DSI operator surface
                </Link>
              </div>
            </section>
          ) : null}

          {view === "evidence" ? (
            <section className="space-y-4" aria-label="Evidence and reconciliation">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
                  Evidence / reconciliation
                </p>
                <h2 className="mt-1 text-base font-medium text-white">
                  Observation and recognition remain separate authorities
                </h2>
              </div>

              <div className="grid gap-px overflow-hidden rounded-lg border border-stone-800 bg-stone-800 md:grid-cols-3">
                <div className="bg-[#0d1210] p-4">
                  <p className="text-[10px] uppercase tracking-wide text-stone-500">Observation</p>
                  <p className="mt-1 text-xs text-white">Machine evidence only</p>
                </div>
                <div className="bg-[#0d1210] p-4">
                  <p className="text-[10px] uppercase tracking-wide text-stone-500">Verification</p>
                  <p className="mt-1 text-xs text-white">
                    {settlement.verificationConfirmedAt ? "Recognized" : "Awaiting operator recognition"}
                  </p>
                </div>
                <div className="bg-[#0d1210] p-4">
                  <p className="text-[10px] uppercase tracking-wide text-stone-500">TAP authority</p>
                  <p className="mt-1 text-xs text-white">
                    {settlement.principalAuthorizedAt ? "Authorized" : "Not authorized"}
                  </p>
                </div>
              </div>

              <p className="max-w-3xl text-xs leading-5 text-stone-500">
                Use Settlement Control for the bounded observer, canonical chain evidence,
                operator recognition, and any subsequent TAP authorization. This workspace is the
                compact transaction-level reading of those authorities.
              </p>

              <Link
                href={`${path}?view=settlement`}
                className="inline-flex rounded border border-cyan-900 px-3 py-2 text-[10px] uppercase tracking-wide text-cyan-300 hover:border-cyan-600"
              >
                Open Settlement Control
              </Link>
            </section>
          ) : null}

          {view === "history" ? (
            <section className="space-y-4" aria-label="Transaction history">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
                  History
                </p>
                <h2 className="mt-1 text-base font-medium text-white">
                  Recorded DSI events
                </h2>
                <p className="mt-1 max-w-3xl text-xs leading-5 text-stone-500">
                  Document execution events will join this register when the governed document
                  authority is connected.
                </p>
              </div>

              <ol className="overflow-hidden rounded-lg border border-stone-800">
                {history.length > 0 ? history.map((event) => (
                  <li
                    key={event.id}
                    className="grid gap-2 border-b border-stone-800 bg-black/20 p-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <span className="text-xs text-white">{formatStatus(event.eventType)}</span>
                    <time className="text-[11px] text-stone-500">{formatDate(event.occurredAt)} UTC</time>
                  </li>
                )) : (
                  <li className="bg-black/20 p-4 text-xs text-stone-500">
                    No recorded domain events are available.
                  </li>
                )}
              </ol>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
