import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/infrastructure/db/prisma";

const REPRESENTATIVE_STATUSES = ["ACTIVE", "PAUSED", "ARCHIVED"] as const;

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
    q?: string;
  }>;
};

function cleanFormValue(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "-");
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-400/40 bg-emerald-400/10 text-emerald-200";
    case "PAUSED":
      return "border-yellow-400/40 bg-yellow-400/10 text-yellow-200";
    case "ARCHIVED":
      return "border-gray-600/50 bg-gray-800/50 text-gray-300";
    default:
      return "border-gray-700 bg-black text-gray-300";
  }
}

async function createRepresentative(formData: FormData) {
  "use server";

  const rawCode = cleanFormValue(formData.get("code"));
  const name = cleanFormValue(formData.get("name"));
  const email = cleanFormValue(formData.get("email"));
  const company = cleanFormValue(formData.get("company"));
  const program = cleanFormValue(formData.get("program"));
  const notes = cleanFormValue(formData.get("notes"));

  if (!rawCode || !name) {
    return;
  }

  const code = normalizeCode(rawCode);

  await prisma.intakeRepresentative.upsert({
    where: { code },
    create: {
      code,
      name,
      email,
      company,
      program,
      notes,
      status: "ACTIVE",
    },
    update: {
      name,
      email,
      company,
      program,
      notes,
    },
  });

  revalidatePath("/admin/transaction-intakes");
  revalidatePath("/admin/transaction-intakes/representatives");
}

async function updateRepresentativeStatus(formData: FormData) {
  "use server";

  const id = cleanFormValue(formData.get("id"));
  const status = cleanFormValue(formData.get("status"));

  if (!id || !status) {
    return;
  }

  if (
    !REPRESENTATIVE_STATUSES.includes(
      status as (typeof REPRESENTATIVE_STATUSES)[number],
    )
  ) {
    return;
  }

  await prisma.intakeRepresentative.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/admin/transaction-intakes");
  revalidatePath("/admin/transaction-intakes/representatives");
}

function buildPublicIntakeHref(rep: {
  code: string;
  name: string;
  program: string | null;
}) {
  const params = new URLSearchParams({
    ref: rep.code,
    rep: rep.name,
  });

  if (rep.program) {
    params.set("program", rep.program);
  }

  return `/transaction-intake?${params.toString()}`;
}

function buildAdminFilterHref(code: string) {
  return `/admin/transaction-intakes?ref=${encodeURIComponent(code)}`;
}

export default async function IntakeRepresentativesPage({
  searchParams,
}: Props) {
  const params = await searchParams;

  const selectedStatus =
    params?.status &&
    REPRESENTATIVE_STATUSES.includes(
      params.status as (typeof REPRESENTATIVE_STATUSES)[number],
    )
      ? params.status
      : "";

  const selectedProgram = params?.program?.trim() || "";
  const query = params?.q?.trim() || "";

  const where = {
    AND: [
      selectedStatus
        ? { status: selectedStatus }
        : { status: { not: "ARCHIVED" } },
      selectedProgram ? { program: selectedProgram } : {},
      query
        ? {
            OR: [
              { code: { contains: query, mode: "insensitive" as const } },
              { name: { contains: query, mode: "insensitive" as const } },
              { email: { contains: query, mode: "insensitive" as const } },
              { company: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {},
    ],
  };

  const [representatives, statusCounts] = await Promise.all([
    prisma.intakeRepresentative.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.intakeRepresentative.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    }),
  ]);

  const countByStatus = new Map(
    statusCounts.map((item) => [item.status, item._count.status]),
  );

  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-gray-400">
            AXPT Admin
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            Intake Representative Registry
          </h1>
          <p className="mt-3 max-w-3xl text-gray-300">
            Maintain approved referral lanes for buyer-side transaction intake.
            Each representative receives a stable code for link issuance and
            queue filtering.
          </p>
        </div>

        <Link
          href="/admin/transaction-intakes"
          className="rounded border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-900"
        >
          Back to Intake Queue
        </Link>
      </div>

      <section className="mb-6 rounded border border-gray-800 bg-gray-950 p-5">
        <h2 className="text-lg font-semibold">
          Create / Update Representative
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          Reusing an existing code updates that representative record.
        </p>

        <form
          className="mt-5 grid gap-3 md:grid-cols-2"
          action={createRepresentative}
        >
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Referral Code
            </span>
            <input
              name="code"
              placeholder="FW-REP-001"
              required
              className="rounded border border-gray-700 bg-black px-3 py-2 text-white"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Representative Name
            </span>
            <input
              name="name"
              placeholder="Representative Name"
              required
              className="rounded border border-gray-700 bg-black px-3 py-2 text-white"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Email
            </span>
            <input
              name="email"
              type="email"
              placeholder="rep@example.com"
              className="rounded border border-gray-700 bg-black px-3 py-2 text-white"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Company
            </span>
            <input
              name="company"
              placeholder="Company / Group"
              className="rounded border border-gray-700 bg-black px-3 py-2 text-white"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Program
            </span>
            <select
              name="program"
              defaultValue="French-Ward Gold"
              className="rounded border border-gray-700 bg-black px-3 py-2 text-white"
            >
              {PROGRAM_OPTIONS.map((program) => (
                <option key={program} value={program}>
                  {program}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Notes
            </span>
            <input
              name="notes"
              placeholder="Internal lane notes"
              className="rounded border border-gray-700 bg-black px-3 py-2 text-white"
            />
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20"
            >
              Save Representative
            </button>
          </div>
        </form>
      </section>

      <section className="mb-6 rounded border border-gray-800 bg-gray-950 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Registry Filters</h2>
            <p className="mt-1 text-sm text-gray-400">
              Archived representatives are hidden unless explicitly filtered.
            </p>
          </div>

          <Link
            href="/admin/transaction-intakes/representatives"
            className="rounded border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-900"
          >
            Clear filters
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {REPRESENTATIVE_STATUSES.map((status) => (
            <Link
              key={status}
              href={`/admin/transaction-intakes/representatives?status=${encodeURIComponent(
                status,
              )}`}
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

        <form className="mt-5 grid gap-3 md:grid-cols-3" method="GET">
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Status
            </span>
            <select
              name="status"
              defaultValue={selectedStatus}
              className="rounded border border-gray-700 bg-black px-3 py-2 text-white"
            >
              <option value="">Active / Paused</option>
              {REPRESENTATIVE_STATUSES.map((status) => (
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
              Search
            </span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Code, name, email, company..."
              className="rounded border border-gray-700 bg-black px-3 py-2 text-white"
            />
          </label>

          <div className="md:col-span-3">
            <button
              type="submit"
              className="rounded border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </section>

      {representatives.length === 0 ? (
        <div className="rounded border border-gray-800 bg-gray-950 p-6 text-gray-300">
          No representatives found for the current filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-800">
          <table className="w-full min-w-[1160px] border-collapse bg-gray-950 text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left text-gray-300">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Representative</th>
                <th className="px-4 py-3">Program</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Links</th>
                <th className="px-4 py-3">Manage</th>
              </tr>
            </thead>

            <tbody>
              {representatives.map((rep) => (
                <tr
                  key={rep.id}
                  className="border-b border-gray-900 text-gray-200 hover:bg-gray-900/40"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-amber-200">
                    {rep.code}
                  </td>

                  <td className="min-w-[220px] px-4 py-3">
                    <p className="font-medium text-gray-100">{rep.name}</p>
                    {rep.email ? (
                      <p className="mt-1 text-xs text-gray-500">{rep.email}</p>
                    ) : null}
                    {rep.company ? (
                      <p className="mt-1 text-xs text-gray-500">
                        {rep.company}
                      </p>
                    ) : null}
                    {rep.notes ? (
                      <p className="mt-2 text-xs text-gray-400">{rep.notes}</p>
                    ) : null}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    {rep.program || "—"}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full border px-2 py-1 text-xs ${statusBadgeClass(
                        rep.status,
                      )}`}
                    >
                      {rep.status}
                    </span>
                  </td>

                  <td className="min-w-[320px] px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <Link
                        href={buildPublicIntakeHref(rep)}
                        className="break-all font-mono text-xs text-blue-300 hover:text-blue-200"
                      >
                        {buildPublicIntakeHref(rep)}
                      </Link>

                      <Link
                        href={buildAdminFilterHref(rep.code)}
                        className="w-fit rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
                      >
                        View Intake Lane
                      </Link>
                    </div>
                  </td>

                  <td className="min-w-[220px] px-4 py-3">
                    <form
                      action={updateRepresentativeStatus}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="id" value={rep.id} />
                      <select
                        name="status"
                        defaultValue={rep.status}
                        className="rounded border border-gray-700 bg-black px-2 py-1 text-xs text-white"
                      >
                        {REPRESENTATIVE_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      <button
                        type="submit"
                        className="rounded border border-gray-700 px-2 py-1 text-xs font-semibold text-gray-200 hover:bg-gray-900"
                      >
                        Update
                      </button>
                    </form>
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
