import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/infrastructure/db/prisma";
import RepresentativeLinkBuilder from "./RepresentativeLinkBuilder";

const INTAKE_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "NEEDS_CLARIFICATION",
  "QUALIFIED",
  "DECLINED",
  "PROMOTED_TO_OPPORTUNITY",
  "DOSSIER_READY",
  "PROMOTED_TO_DOSSIER",
] as const;

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

async function updateIntakeStatus(formData: FormData) {
  "use server";

  const id = formData.get("id");
  const status = formData.get("status");

  if (typeof id !== "string" || typeof status !== "string") {
    return;
  }

  if (!INTAKE_STATUSES.includes(status as (typeof INTAKE_STATUSES)[number])) {
    return;
  }

  const existing = await prisma.transactionIntake.findUnique({
    where: { id },
    select: {
      status: true,
    },
  });

  if (!existing) {
    return;
  }

  if (existing.status === status) {
    return;
  }

  await prisma.$transaction([
    prisma.transactionIntake.update({
      where: { id },
      data: { status },
    }),
    prisma.transactionIntakeEvent.create({
      data: {
        intakeId: id,
        eventType: "STATUS_CHANGED",
        fromStatus: existing.status,
        toStatus: status,
        actor: "ADMIN",
      },
    }),
  ]);

  revalidatePath("/admin/transaction-intakes");
  revalidatePath(`/admin/transaction-intakes/${id}`);
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "UNDER_REVIEW":
      return "border-blue-400/40 bg-blue-400/10 text-blue-200";
    case "NEEDS_CLARIFICATION":
      return "border-yellow-400/40 bg-yellow-400/10 text-yellow-200";
    case "QUALIFIED":
    case "PROMOTED_TO_OPPORTUNITY":
    case "DOSSIER_READY":
    case "PROMOTED_TO_DOSSIER":
      return "border-emerald-400/40 bg-emerald-400/10 text-emerald-200";
    case "DECLINED":
      return "border-red-400/40 bg-red-400/10 text-red-200";
    case "SUBMITTED":
    default:
      return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  }
}

function buildStatusHref(status: string) {
  return `/admin/transaction-intakes?status=${encodeURIComponent(status)}`;
}

export default async function TransactionIntakesAdminPage({
  searchParams,
}: Props) {
  const params = await searchParams;

  const selectedStatus =
    params?.status &&
    INTAKE_STATUSES.includes(params.status as (typeof INTAKE_STATUSES)[number])
      ? params.status
      : "";

  const selectedProgram = params?.program?.trim() || "";
  const referralCode = params?.ref?.trim() || "";
  const query = params?.q?.trim() || "";

  const where = {
    AND: [
      selectedStatus ? { status: selectedStatus } : {},
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

  const [intakes, statusCounts, referralCounts] = await Promise.all([
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
    <main className="min-h-screen bg-black text-white p-8">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.28em] text-gray-400">
          AXPT Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold">Transaction Intakes</h1>
        <p className="mt-3 max-w-3xl text-gray-300">
          Review buyer-side transaction intake submissions, referral
          attribution, commercial structure, and readiness status before
          qualification or promotion.
        </p>
      </div>

      <section className="mb-6 rounded border border-gray-800 bg-gray-950 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Quick Review</h2>
            <p className="mt-1 text-sm text-gray-400">
              Filter the queue by review state, program, referral source, or
              searchable transaction details.
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
          {INTAKE_STATUSES.map((status) => (
            <Link
              key={status}
              href={buildStatusHref(status)}
              className={`rounded-full border px-3 py-1 text-xs ${statusBadgeClass(
                status,
              )} ${
                selectedStatus === status
                  ? "ring-2 ring-white/30"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              {status} ({countByStatus.get(status) || 0})
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
              {INTAKE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
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

      <section className="mb-6 rounded border border-gray-800 bg-gray-950 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Representative Link Guide</h2>
            <p className="mt-1 max-w-3xl text-sm text-gray-400">
              Issue buyer-safe intake links with a referral code, representative
              name, and program. Submitted records can be filtered by referral
              lane.
            </p>
          </div>

          <Link
            href="/transaction-intake"
            className="rounded border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-200 hover:bg-blue-500/20"
          >
            Open Public Intake
          </Link>
        </div>

        <div className="mt-5">
          <RepresentativeLinkBuilder />
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
        <section className="mb-4 rounded border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-amber-300/80">
                Active Filters
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {selectedStatus ? (
                  <span className="rounded-full border border-gray-700 bg-black px-3 py-1 text-xs text-gray-200">
                    Status: {selectedStatus}
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

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-400">
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
        <div className="overflow-x-auto rounded border border-gray-800">
          <table className="w-full min-w-[1320px] border-collapse bg-gray-950 text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left text-gray-300">
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
                  className="border-b border-gray-900 text-gray-200 hover:bg-gray-900/40"
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
                      className={`rounded-full border px-2 py-1 text-xs ${statusBadgeClass(
                        intake.status,
                      )}`}
                    >
                      {intake.status}
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

                      <form
                        action={updateIntakeStatus}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="id" value={intake.id} />
                        <select
                          key={intake.status}
                          name="status"
                          defaultValue={intake.status}
                          className="max-w-[150px] rounded border border-gray-700 bg-black px-2 py-1 text-xs text-white"
                        >
                          {INTAKE_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>

                        <button
                          type="submit"
                          className="rounded border border-amber-500/50 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
                        >
                          Update
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
