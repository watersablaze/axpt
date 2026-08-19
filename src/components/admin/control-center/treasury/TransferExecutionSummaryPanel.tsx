"use client";

import { FormEvent, useState } from "react";

type Money = Readonly<{
  amount: string;

  currency: string;
}>;

type PreExecutionTransfer = Readonly<{
  id: string;

  reference: string;

  status: string;

  version: number;

  programId: string;

  instructionId?: string;

  requestedAmount: Money;

  destinationCurrency: string;

  purpose: string;

  createdAt: string;

  updatedAt: string;
}>;

type TransferExecutionSummary = Readonly<{
  transferId: string;

  transferStatus: string;

  transferVersion: number;

  planId: string;

  planStatus: string;

  planVersion: number;

  trancheCounts: Readonly<{
    total: number;

    planned: number;

    eligible: number;

    ineligible: number;

    requiresClarification: number;

    boundToExecution: number;
  }>;

  executionCounts: Readonly<Record<string, number>>;

  amounts: Readonly<{
    planned: Money;

    bound: Money;

    confirmed: Money;

    failed: Money;

    remainingUnbound: Money;
  }>;

  lastUpdatedAt: string;
}>;

type TransferExecutionPerception =
  | Readonly<{
      kind: "PRE_EXECUTION";

      transfer: PreExecutionTransfer;
    }>
  | Readonly<{
      kind: "EXECUTION_SUMMARY";

      summary: TransferExecutionSummary;
    }>;

type PerceptionResponse =
  | Readonly<{
      ok: true;

      perception: TransferExecutionPerception;
    }>
  | Readonly<{
      ok: false;

      error: string;
    }>;

function formatMoney(money: Money): string {
  const numericAmount = Number(money.amount);

  if (!Number.isFinite(numericAmount)) {
    return `${money.amount} ${money.currency}`;
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(numericAmount)} ${money.currency}`;
}

function countExecution(
  summary: TransferExecutionSummary,
  status: string,
): number {
  return summary.executionCounts[status] ?? 0;
}

export default function TransferExecutionSummaryPanel() {
  const [transferId, setTransferId] = useState("");

  const [perception, setPerception] =
    useState<TransferExecutionPerception | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function observeTransfer(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const normalizedTransferId = transferId.trim();

    if (normalizedTransferId.length === 0) {
      setPerception(null);

      setError("Enter a Treasury Transfer ID.");

      return;
    }

    setLoading(true);

    setError(null);

    try {
      const response = await fetch(
        `/api/admin/control-center/treasury/transfers/${encodeURIComponent(
          normalizedTransferId,
        )}/execution-summary`,
        {
          cache: "no-store",

          credentials: "include",
        },
      );

      const payload = (await response.json()) as PerceptionResponse;

      if (!response.ok || !payload.ok) {
        setPerception(null);

        setError(
          payload.ok
            ? "Treasury perception could not be loaded."
            : payload.error,
        );

        return;
      }

      setPerception(payload.perception);
    } catch (cause: unknown) {
      console.error("[CONTROL_CENTER_TREASURY_PERCEPTION_LOAD_FAILED]", cause);

      setPerception(null);

      setError("Treasury perception could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  const preExecution =
    perception?.kind === "PRE_EXECUTION" ? perception.transfer : null;

  const summary =
    perception?.kind === "EXECUTION_SUMMARY" ? perception.summary : null;

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <div className="flex flex-col gap-4 border-b border-neutral-800 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            Treasury Perception
          </div>

          <h1 className="mt-1 text-xl font-medium text-white">
            Transfer Execution Posture
          </h1>

          <p className="mt-2 max-w-2xl text-xs leading-5 text-neutral-500">
            Read-only perception of canonical Treasury Transfer state and, where
            established, its execution plan, executable tranches, and bound
            Treasury Executions.
          </p>
        </div>

        <form
          onSubmit={observeTransfer}
          className="flex w-full gap-2 md:w-auto"
        >
          <input
            value={transferId}
            onChange={(event) => setTransferId(event.target.value)}
            placeholder="Treasury Transfer ID"
            aria-label="Treasury Transfer ID"
            className="min-w-0 flex-1 rounded border border-neutral-800 bg-black/40 px-3 py-2 text-xs text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-cyan-900 md:w-80"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded border border-neutral-700 bg-black/30 px-3 py-2 text-[10px] uppercase tracking-wide text-neutral-300 hover:border-cyan-800 hover:text-cyan-300 disabled:cursor-wait disabled:opacity-50"
          >
            {loading ? "Observing" : "Observe"}
          </button>
        </form>
      </div>

      {error ? (
        <div className="mt-4 rounded border border-orange-950 bg-orange-950/10 p-3 text-xs text-orange-300">
          {error}
        </div>
      ) : null}

      {!perception && !error ? (
        <div className="mt-4 rounded border border-neutral-800 bg-black/20 p-4 text-xs text-neutral-500">
          Enter a Treasury Transfer ID to perceive its current Treasury posture.
        </div>
      ) : null}

      {preExecution ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <article className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Transfer
              </div>

              <div className="mt-2 break-all text-sm text-white">
                {preExecution.id}
              </div>

              <div className="mt-3 flex items-center justify-between gap-4 text-xs">
                <span className="text-neutral-500">Reference</span>

                <span className="text-right text-neutral-300">
                  {preExecution.reference}
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Status</span>

                <span className="text-cyan-300">{preExecution.status}</span>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Version</span>

                <span className="text-neutral-300">{preExecution.version}</span>
              </div>
            </article>

            <article className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Execution Planning
              </div>

              <div className="mt-2 text-sm text-neutral-200">
                Not Yet Established
              </div>

              <p className="mt-3 text-xs leading-5 text-neutral-500">
                This Treasury Transfer exists canonically. No execution plan has
                yet been established for it.
              </p>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Posture</span>

                <span className="text-neutral-300">PRE_EXECUTION</span>
              </div>
            </article>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <article className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Program
              </div>

              <div className="mt-2 break-all text-xs text-neutral-200">
                {preExecution.programId}
              </div>

              {preExecution.instructionId ? (
                <>
                  <div className="mt-3 text-[10px] uppercase tracking-wide text-neutral-600">
                    Instruction
                  </div>

                  <div className="mt-2 break-all text-xs text-neutral-300">
                    {preExecution.instructionId}
                  </div>
                </>
              ) : null}
            </article>

            <article className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Requested Capital
              </div>

              <div className="mt-2 text-sm text-white">
                {formatMoney(preExecution.requestedAmount)}
              </div>

              <div className="mt-3 flex items-center justify-between gap-4 text-xs">
                <span className="text-neutral-500">Destination Currency</span>

                <span className="text-neutral-300">
                  {preExecution.destinationCurrency}
                </span>
              </div>
            </article>

            <article className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Purpose
              </div>

              <p className="mt-2 text-xs leading-5 text-neutral-300">
                {preExecution.purpose}
              </p>
            </article>
          </div>

          <div className="flex flex-wrap justify-between gap-3 border-t border-neutral-800 pt-3 text-[10px] uppercase tracking-wide text-neutral-600">
            <span>Read Only</span>

            <span>
              Last observed {new Date(preExecution.updatedAt).toLocaleString()}
            </span>
          </div>
        </div>
      ) : null}

      {summary ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <article className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Transfer
              </div>

              <div className="mt-2 break-all text-sm text-white">
                {summary.transferId}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Status</span>

                <span className="text-cyan-300">{summary.transferStatus}</span>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Version</span>

                <span className="text-neutral-300">
                  {summary.transferVersion}
                </span>
              </div>
            </article>

            <article className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Execution Plan
              </div>

              <div className="mt-2 break-all text-sm text-white">
                {summary.planId}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Status</span>

                <span className="text-cyan-300">{summary.planStatus}</span>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Version</span>

                <span className="text-neutral-300">{summary.planVersion}</span>
              </div>
            </article>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <article className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Tranche Posture
              </div>

              <dl className="mt-3 space-y-2 text-xs">
                {[
                  ["Total", summary.trancheCounts.total],
                  ["Planned", summary.trancheCounts.planned],
                  ["Eligible", summary.trancheCounts.eligible],
                  ["Ineligible", summary.trancheCounts.ineligible],
                  [
                    "Requires Clarification",
                    summary.trancheCounts.requiresClarification,
                  ],
                  [
                    "Bound to Execution",
                    summary.trancheCounts.boundToExecution,
                  ],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="flex justify-between gap-4"
                  >
                    <dt className="text-neutral-500">{label}</dt>

                    <dd className="text-neutral-200">{value}</dd>
                  </div>
                ))}
              </dl>
            </article>

            <article className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Execution Posture
              </div>

              <dl className="mt-3 space-y-2 text-xs">
                {[
                  ["Created", countExecution(summary, "CREATED")],
                  ["Authorized", countExecution(summary, "AUTHORIZED")],
                  ["Queued", countExecution(summary, "QUEUED")],
                  ["Initiated", countExecution(summary, "INITIATED")],
                  ["Confirmed", countExecution(summary, "CONFIRMED")],
                  ["Failed", countExecution(summary, "FAILED")],
                  [
                    "Requires Intervention",
                    countExecution(summary, "REQUIRES_INTERVENTION"),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="flex justify-between gap-4"
                  >
                    <dt className="text-neutral-500">{label}</dt>

                    <dd className="text-neutral-200">{value}</dd>
                  </div>
                ))}
              </dl>
            </article>

            <article className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Capital Posture
              </div>

              <dl className="mt-3 space-y-2 text-xs">
                {[
                  ["Planned", summary.amounts.planned],
                  ["Bound", summary.amounts.bound],
                  ["Confirmed", summary.amounts.confirmed],
                  ["Failed", summary.amounts.failed],
                  ["Remaining Unbound", summary.amounts.remainingUnbound],
                ].map(([label, money]) => (
                  <div
                    key={String(label)}
                    className="flex justify-between gap-4"
                  >
                    <dt className="text-neutral-500">{String(label)}</dt>

                    <dd className="text-right text-neutral-200">
                      {formatMoney(money as Money)}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          </div>

          <div className="flex flex-wrap justify-between gap-3 border-t border-neutral-800 pt-3 text-[10px] uppercase tracking-wide text-neutral-600">
            <span>Read Only</span>

            <span>
              Last observed {new Date(summary.lastUpdatedAt).toLocaleString()}
            </span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
