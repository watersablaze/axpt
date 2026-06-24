import { prisma } from "@/infrastructure/db/prisma";

function statusTone(status: string | null) {
  switch (status) {
    case "SENT":
      return "border-emerald-400/40 bg-emerald-400/10 text-emerald-200";
    case "FAILED":
      return "border-red-400/40 bg-red-400/10 text-red-200";
    case "LOGGED_ONLY":
      return "border-sky-400/40 bg-sky-400/10 text-sky-200";
    case "SKIPPED_NO_RECIPIENTS":
      return "border-amber-400/40 bg-amber-400/10 text-amber-200";
    default:
      return "border-white/15 bg-white/5 text-white/70";
  }
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function labelType(type: string | null) {
  switch (type) {
    case "TRANSACTION_INTAKE_CONFIRMATION":
      return "Buyer Confirmation";
    case "TRANSACTION_INTAKE_INTERNAL_NOTIFICATION":
      return "Internal Notification";
    default:
      return type || "Email Log";
  }
}

export async function RecentIntakeEmailLogPanel() {
  const logs = await prisma.emailLog.findMany({
    where: {
      type: {
        in: [
          "TRANSACTION_INTAKE_CONFIRMATION",
          "TRANSACTION_INTAKE_INTERNAL_NOTIFICATION",
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      type: true,
      from: true,
      to: true,
      subject: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">
            Intake Trail
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Recent Email Logs
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Confirmation and internal notification records for transaction
            intake submissions. In log mode, emails are recorded here without
            being sent.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
          Showing last{" "}
          <span className="font-semibold text-white">{logs.length}</span>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-sm text-slate-400">
          No transaction intake email logs yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.03]">
                  <td className="whitespace-nowrap px-4 py-4 text-slate-400">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-white">
                      {labelType(log.type)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      From: {log.from || "Not set"}
                    </div>
                  </td>
                  <td className="max-w-[220px] px-4 py-4 text-slate-300">
                    <span className="line-clamp-2">{log.to || "Not set"}</span>
                  </td>
                  <td className="max-w-[360px] px-4 py-4 text-slate-300">
                    <span className="line-clamp-2">
                      {log.subject || "No subject"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(
                        log.status,
                      )}`}
                    >
                      {log.status || "UNKNOWN"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
