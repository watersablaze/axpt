import Link from "next/link";
import { prisma } from "@/infrastructure/db/prisma";
import RepresentativeLinkBuilder from "./RepresentativeLinkBuilder";
import { RecentIntakeEmailLogPanel } from "./RecentIntakeEmailLogPanel";
import {
  DEFAULT_TRANSACTION_INTAKE_HIDDEN_STATUSES,
  TRANSACTION_INTAKE_STATUSES,
  getTransactionIntakeStatusLabel,
  getTransactionIntakeStatusTone,
} from "@/domains/control-center/transaction-intakes/intakeStatuses";

const PROGRAM_OPTIONS = [
  "French-Ward Gold",
  "Bafoula Cooperative",
  "AXPT Strategic Intake",
  "General",
  "Other",
] as const;

type Props = {
  searchParams?: Promise<{
    status?: string;
    program?: string;
    ref?: string;
    q?: string;
  }>;
};

function buildStatusHref(status: string) {
  return `/admin/transaction-intakes?status=${encodeURIComponent(status)}`;
}

export default async function TransactionIntakesAdminPage({
  searchParams,
}: Props) {
  const params = await searchParams;

  const selectedStatus =
    params?.status &&
    TRANSACTION_INTAKE_STATUSES.includes(
      params.status as (typeof TRANSACTION_INTAKE_STATUSES)[number],
    )
      ? params.status
      : "";

  const selectedProgram = params?.program?.trim() || "";
  const referralCode = params?.ref?.trim() || "";
  const query = params?.q?.trim() || "";

  const where = {
    AND: [
      selectedStatus
        ? { status: selectedStatus }
        : {
            status: { notIn: [...DEFAULT_TRANSACTION_INTAKE_HIDDEN_STATUSES] },
          },
      selectedProgram ? { program: selectedProgram } : {},
      referralCode ? { referralCode } : {},
      query
        ? {
            OR: [
              { reference: { contains: query, mode: "insensitive" as const } },
              {
                submitterName: {
                  contains: query,
                  mode: "insensitive" as const,
                },
              },
              {
                submitterEmail: {
                  contains: query,
                  mode: "insensitive" as const,
                },
              },
              {
                submitterCompany: {
                  contains: query,
                  mode: "insensitive" as const,
                },
              },
              {
                representedPartyName: {
                  contains: query,
                  mode: "insensitive" as const,
                },
              },
              {
                commodity: {
                  contains: query,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {},
    ],
  };

  const [intakes, statusCounts, referralCounts, representativesForBuilder] =
    await Promise.all([
      prisma.transactionIntake.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.transactionIntake.groupBy({
        by: ["status"],
        _count: {
          status: true,
        },
      }),
      prisma.transactionIntake.groupBy({
        by: ["referralCode"],
        _count: {
          referralCode: true,
        },
        where: {
          referralCode: {
            not: null,
          },
        },
        orderBy: {
          _count: {
            referralCode: "desc",
          },
        },
        take: 12,
      }),
      prisma.intakeRepresentative.findMany({
        where: {
          status: {
            in: ["ACTIVE", "PAUSED"],
          },
        },
        select: {
          id: true,
          code: true,
          name: true,
          program: true,
          status: true,
        },
        orderBy: [{ status: "asc" }, { code: "asc" }],
      }),
    ]);

  const countByStatus = new Map(
    statusCounts.map((item) => [item.status, item._count.status]),
  );

  const referralLanes = referralCounts
    .filter((item) => item.referralCode)
    .map((item) => ({
      code: item.referralCode as string,
      count: item._count.referralCode,
    }));

  const activeFilterCount = [
    selectedStatus,
    selectedProgram,
    referralCode,
    query,
  ].filter(Boolean).length;

  return (
    <main className="min-h-full bg-[#090d10] text-neutral-100">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <header className="border-b border-neutral-800/80 pb-5">
          <p className="text-[9px] uppercase tracking-[0.18em] text-amber-300/75">
            French-Ward · Transaction Administration
          </p>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-xl font-medium text-white sm:text-2xl">
                Transaction intake registry
              </h1>

              <p className="mt-2 max-w-3xl text-xs leading-5 text-neutral-500">
                Review submitted commercial records, referral provenance, and readiness before qualification or promotion.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/transaction-intakes/external-import"
                className="border border-neutral-700/70 px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-neutral-300 transition hover:border-neutral-500 hover:text-white"
              >
                External registration
              </Link>

              <Link
                href="/admin/transaction-intakes/representatives"
                className="border border-amber-800/50 bg-amber-950/[0.08] px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-amber-200 transition hover:border-amber-600/70"
              >
                Representatives
              </Link>
            </div>
          </div>
        </header>

      <section className="mt-6 border border-neutral-800/70 bg-[#0b1116] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.16em] text-neutral-600">
              Queue controls
            </p>
            <h2 className="mt-1 text-base font-medium text-white">
              Intake review queue
            </h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-neutral-500">
              Filter the working registry by review state, program, referral source, or searchable transaction details.
            </p>
          </div>

          {activeFilterCount > 0 && (
            <Link
              href="/admin/transaction-intakes"
              className="rounded border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-900"
            >
              Clear filters
            </Link>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {TRANSACTION_INTAKE_STATUSES.map((status) => (
            <Link
              key={status}
              href={buildStatusHref(status)}
              className={`rounded-full border px-3 py-1 text-xs ${getTransactionIntakeStatusTone(
                status,
              )} ${
                selectedStatus === status
                  ? "ring-2 ring-white/30"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              {getTransactionIntakeStatusLabel(status)} (
              {countByStatus.get(status) || 0})
            </Link>
          ))}
        </div>

        <form className="mt-5 grid gap-3 md:grid-cols-4" method="GET">
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Status
            </span>
            <select
              name="status"
              defaultValue={selectedStatus}
              className="rounded border border-gray-700 bg-black px-3 py-2 text-white"
            >
              <option value="">All statuses</option>
              {TRANSACTION_INTAKE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {getTransactionIntakeStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Program
            </span>
            <select
              name="program"
              defaultValue={selectedProgram}
              className="rounded border border-gray-700 bg-black px-3 py-2 text-white"
            >
              <option value="">All programs</option>
              {PROGRAM_OPTIONS.map((program) => (
                <option key={program} value={program}>
                  {program}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Referral Code
            </span>
            <input
              name="ref"
              defaultValue={referralCode}
              placeholder="FW-REP-001"
              className="rounded border border-gray-700 bg-black px-3 py-2 text-white"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Search
            </span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Reference, name, email, commodity..."
              className="rounded border border-gray-700 bg-black px-3 py-2 text-white"
            />
          </label>

          <div className="md:col-span-4">
            <button
              type="submit"
              className="rounded border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </section>

      <section className="mt-4 border-y border-neutral-900 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.16em] text-neutral-600">
              Referral administration
            </p>
            <h2 className="mt-1 text-sm font-medium text-neutral-200">
              Representative intake links
            </h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-neutral-600">
              Issue buyer-safe referral links and inspect submitted records by representative lane.
            </p>
          </div>

          <Link
            href="/french-ward/transaction-intake"
            className="text-[10px] uppercase tracking-[0.12em] text-neutral-500 transition hover:text-white"
          >
            Open public intake ↗
          </Link>
        </div>

        <div className="mt-5">
          <RepresentativeLinkBuilder
            representatives={representativesForBuilder}
          />
        </div>

        <div className="mt-5">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Active Referral Lanes
          </p>

          {referralLanes.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">
              No referral-coded submissions have been received yet.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {referralLanes.map((lane) => (
                <Link
                  key={lane.code}
                  href={`/admin/transaction-intakes?ref=${encodeURIComponent(
                    lane.code,
                  )}`}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    referralCode === lane.code
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-200"
                      : "border-gray-700 bg-black text-gray-300 hover:bg-gray-900"
                  }`}
                >
                  {lane.code} ({lane.count})
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {activeFilterCount > 0 && (
        <section className="mt-4 border-l-2 border-amber-800/60 bg-amber-950/[0.05] px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-amber-300/80">
                Active Filters
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {selectedStatus ? (
                  <span className="rounded-full border border-gray-700 bg-black px-3 py-1 text-xs text-gray-200">
                    Status: {getTransactionIntakeStatusLabel(selectedStatus)}
                  </span>
                ) : null}

                {selectedProgram ? (
                  <span className="rounded-full border border-gray-700 bg-black px-3 py-1 text-xs text-gray-200">
                    Program: {selectedProgram}
                  </span>
                ) : null}

                {referralCode ? (
                  <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                    Referral: {referralCode}
                  </span>
                ) : null}

                {query ? (
                  <span className="rounded-full border border-gray-700 bg-black px-3 py-1 text-xs text-gray-200">
                    Search: {query}
                  </span>
                ) : null}
              </div>
            </div>

            <Link
              href="/admin/transaction-intakes"
              className="rounded border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-900"
            >
              Clear all filters
            </Link>
          </div>
        </section>
      )}

      <section className="mt-7">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.16em] text-neutral-600">
              Working register
            </p>
            <h2 className="mt-1 text-base font-medium text-white">
              Intake records
            </h2>
          </div>

          <div className="text-[10px] text-neutral-600">
            {intakes.length} record{intakes.length === 1 ? "" : "s"}
          </div>
        </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
        <p>
          Showing {intakes.length} intake{intakes.length === 1 ? "" : "s"}
          {activeFilterCount > 0
            ? ` with ${activeFilterCount} active filter${
                activeFilterCount === 1 ? "" : "s"
              }`
            : " in the current queue"}
          .
        </p>

        {referralCode ? (
          <p className="text-amber-200">Referral lane: {referralCode}</p>
        ) : null}
      </div>

      {intakes.length === 0 ? (
        <div className="rounded border border-gray-800 bg-gray-950 p-6 text-gray-300">
          No transaction intakes found for the current filters.
        </div>
      ) : (
        <div className="overflow-x-auto border-y border-neutral-800/80">
          <table className="w-full min-w-[1320px] border-collapse bg-transparent text-xs">
            <thead>
              <tr className="border-b border-neutral-800/80 text-left text-[9px] uppercase tracking-[0.12em] text-neutral-600">
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitter / Buyer</th>
                <th className="px-4 py-3">Structure</th>
                <th className="px-4 py-3">Commodity</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Referral</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Review</th>
              </tr>
            </thead>

            <tbody>
              {intakes.map((intake) => (
                <tr
                  key={intake.id}
                  className="border-b border-neutral-900 text-neutral-300 transition hover:bg-white/[0.015]"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                    <Link
                      href={`/admin/transaction-intakes/${intake.id}`}
                      className="text-blue-300 hover:text-blue-200"
                    >
                      {intake.reference}
                    </Link>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full border px-2 py-1 text-xs ${getTransactionIntakeStatusTone(
                        intake.status,
                      )}`}
                    >
                      {getTransactionIntakeStatusLabel(intake.status)}
                    </span>
                  </td>

                  <td className="min-w-[190px] px-4 py-3">
                    <p className="font-medium text-gray-100">
                      {intake.submitterName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {intake.submitterRole}
                    </p>
                    {intake.buyerName ? (
                      <p className="mt-1 text-xs text-gray-400">
                        Buyer: {intake.buyerName}
                      </p>
                    ) : null}
                  </td>

                  <td className="min-w-[170px] px-4 py-3">
                    <p className="text-gray-100">
                      {intake.transactionType || "—"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {intake.deliveryTerms || "No delivery term"} ·{" "}
                      {intake.settlementMethod || "No settlement method"}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    {intake.commodity || "—"}
                  </td>

                  <td className="min-w-[150px] px-4 py-3">
                    <p>{intake.quantity || "—"}</p>
                    {intake.trialQuantity || intake.monthlyQuantity ? (
                      <p className="mt-1 text-xs text-gray-500">
                        {intake.trialQuantity
                          ? `Trial: ${intake.trialQuantity}`
                          : ""}
                        {intake.trialQuantity && intake.monthlyQuantity
                          ? " · "
                          : ""}
                        {intake.monthlyQuantity
                          ? `Monthly: ${intake.monthlyQuantity}`
                          : ""}
                      </p>
                    ) : null}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    {intake.destination || "—"}
                  </td>

                  <td className="min-w-[150px] px-4 py-3">
                    <p>{intake.referralCode || "—"}</p>
                    {intake.referredByName ? (
                      <p className="mt-1 text-xs text-gray-500">
                        {intake.referredByName}
                      </p>
                    ) : null}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                    {intake.createdAt.toLocaleString()}
                  </td>

                  <td className="min-w-[230px] px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/admin/transaction-intakes/${intake.id}`}
                        className="w-fit rounded border border-blue-500/40 bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-200 hover:bg-blue-500/20"
                      >
                        Open Review
                      </Link>

                      <p className="max-w-[210px] text-xs leading-5 text-gray-500">
                        Review disposition is managed inside the intake record
                        so status changes retain context and event history.
                      </p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </section>

      <section className="mt-8 border-t border-neutral-900 pt-5">
        <p className="mb-3 text-[9px] uppercase tracking-[0.16em] text-neutral-600">
          Delivery diagnostics
        </p>
        <RecentIntakeEmailLogPanel />
      </section>
      </div>
    </main>
  );
}
