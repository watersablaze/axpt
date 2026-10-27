import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import {
  getPrincipal,
} from "@/domains/auth/getPrincipal";
import {
  isAdmin,
} from "@/domains/auth/isAdmin";
import {
  prisma,
} from "@/infrastructure/db/prisma";

export const dynamic =
  "force-dynamic";

type AlertRow = {
  id: number;
  subject: string;
  status: string | null;
  messageId: string | null;
  createdAt: Date;
};

function formatDate(
  value: Date
) {
  return new Intl.DateTimeFormat(
    "en",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(value);
}

function statusTone(
  status: string | null
) {
  switch (status) {
    case "SENT":
      return "text-emerald-300";
    case "FAILED":
      return "text-rose-300";
    case "QUEUED":
      return "text-amber-300";
    case "LOGGED_ONLY":
      return "text-cyan-300";
    default:
      return "text-neutral-500";
  }
}

function statusLabel(
  status: string | null
) {
  return (
    status
      ?.replaceAll(
        "_",
        " "
      ) ??
    "UNKNOWN"
  );
}

function canProcess(
  status: string | null
) {
  return [
    "QUEUED",
    "FAILED",
    "LOGGED_ONLY",
  ].includes(
    status ?? ""
  );
}

export default async function AlertDeliveryPage() {
  const principal =
    await getPrincipal();

  if (!principal) {
    redirect(
      "/login?next=/admin/incoming/alerts"
    );
  }

  if (!isAdmin(principal)) {
    notFound();
  }

  const rows =
    (await prisma.emailLog.findMany({
      where: {
        type: {
          startsWith:
            "ADMIN_INCOMING_V1:",
        },
      },
      orderBy: {
        id: "desc",
      },
      take: 100,
      select: {
        id: true,
        subject: true,
        status: true,
        messageId: true,
        createdAt: true,
      },
    })) as AlertRow[];

  const mode =
    process.env
      .ADMIN_INCOMING_ALERT_EMAIL_MODE ===
    "send"
      ? "Send"
      : "Log only";

  const sentCount =
    rows.filter(
      row =>
        row.status ===
        "SENT"
    ).length;

  const exceptionCount =
    rows.filter(
      row =>
        row.status ===
          "FAILED" ||
        row.status ===
          "QUEUED" ||
        row.status ===
          "LOGGED_ONLY"
    ).length;

  return (
    <main className="min-h-full bg-[#090d10] text-neutral-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
          <Link
            href="/admin/incoming"
            className="text-[10px] uppercase tracking-[0.14em] text-neutral-500 transition hover:text-neutral-200"
          >
            ← Incoming work
          </Link>

          <span className="text-[9px] uppercase tracking-[0.15em] text-neutral-600">
            Latest 100 records
          </span>
        </div>

        <header className="border-b border-neutral-800/80 py-5">
          <p className="text-[9px] uppercase tracking-[0.18em] text-cyan-300/75">
            AXPT Administration · Delivery Diagnostics
          </p>

          <h1 className="mt-2 text-xl font-medium text-white sm:text-2xl">
            Admin alert delivery
          </h1>

          <p className="mt-2 max-w-3xl text-xs leading-5 text-neutral-500">
            Review recorded notification outcomes, provider acceptance references, and guarded retry eligibility.
          </p>
        </header>

        <section
          aria-label="Delivery posture"
          className="grid border-b border-neutral-800/80 sm:grid-cols-3"
        >
          <div className="border-b border-neutral-800/60 py-4 sm:border-b-0 sm:border-r sm:pr-5">
            <p className="text-[9px] uppercase tracking-[0.14em] text-neutral-600">
              Delivery mode
            </p>

            <p className="mt-1 text-sm text-white">
              {mode}
            </p>
          </div>

          <div className="border-b border-neutral-800/60 py-4 sm:border-b-0 sm:border-r sm:px-5">
            <p className="text-[9px] uppercase tracking-[0.14em] text-neutral-600">
              Destination
            </p>

            <p className="mt-1 text-sm text-white">
              connect@axpt.io
            </p>
          </div>

          <div className="py-4 sm:pl-5">
            <p className="text-[9px] uppercase tracking-[0.14em] text-neutral-600">
              Current sample
            </p>

            <p className="mt-1 text-sm text-white">
              {sentCount} accepted
              <span className="mx-2 text-neutral-700">
                ·
              </span>
              {exceptionCount} require attention
            </p>
          </div>
        </section>

        <section className="mt-5 border-l-2 border-amber-700/60 bg-amber-950/[0.07] px-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.14em] text-amber-300/80">
            Delivery doctrine
          </p>

          <p className="mt-1 max-w-4xl text-xs leading-5 text-neutral-400">
            SENT means the email provider accepted the message. It does not confirm inbox delivery. Uncertain or interrupted sends are held to avoid duplicates; verify provider state before processing an uncertain alert again.
          </p>
        </section>

        <section
          aria-labelledby="alert-register-heading"
          className="mt-7"
        >
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-[9px] uppercase tracking-[0.16em] text-neutral-600">
                Delivery register
              </p>

              <h2
                id="alert-register-heading"
                className="mt-1 text-base font-medium text-white"
              >
                Recorded admin alerts
              </h2>
            </div>

            <span className="text-[10px] tabular-nums text-neutral-600">
              {rows.length}
            </span>
          </div>

          {!rows.length ? (
            <div className="border-y border-neutral-900 py-8 text-sm text-neutral-600">
              No alerts recorded yet.
            </div>
          ) : (
            <ol className="divide-y divide-neutral-900 border-y border-neutral-900">
              {rows.map(
                row => (
                  <li
                    key={
                      row.id
                    }
                    className="grid gap-3 py-4 md:grid-cols-[150px_minmax(0,1fr)_auto] md:items-start md:gap-5"
                  >
                    <div className="text-[10px] leading-5 text-neutral-600">
                      <p>
                        {formatDate(
                          row.createdAt
                        )}
                      </p>

                      <p
                        className={`mt-1 text-[9px] uppercase tracking-[0.13em] ${statusTone(
                          row.status
                        )}`}
                      >
                        {statusLabel(
                          row.status
                        )}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <h3 className="break-words text-sm leading-5 text-neutral-200">
                        {row.subject}
                      </h3>

                      <div className="mt-2 text-[10px] leading-5 text-neutral-600">
                        {row.messageId ? (
                          <>
                            <span>
                              Provider reference
                            </span>

                            <p className="mt-0.5 break-all font-mono text-[9px] text-neutral-500">
                              {row.messageId}
                            </p>
                          </>
                        ) : (
                          <span>
                            No provider reference recorded
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="md:min-w-[130px] md:text-right">
                      {canProcess(
                        row.status
                      ) ? (
                        <form
                          method="post"
                          action="/api/admin/incoming/alerts/retry"
                        >
                          <input
                            type="hidden"
                            name="id"
                            value={
                              row.id
                            }
                          />

                          <button
                            type="submit"
                            className="inline-flex min-h-8 items-center border border-amber-800/45 bg-amber-950/[0.08] px-2.5 text-[9px] uppercase tracking-[0.12em] text-amber-200 transition hover:border-amber-600/65 hover:bg-amber-950/20"
                          >
                            Process alert
                          </button>
                        </form>
                      ) : (
                        <span className="text-[9px] uppercase tracking-[0.12em] text-neutral-700">
                          No action
                        </span>
                      )}
                    </div>
                  </li>
                )
              )}
            </ol>
          )}
        </section>

        <footer className="mt-6 border-t border-neutral-900 pt-4 text-[10px] leading-5 text-neutral-600">
          This register includes access-request, general-inquiry, and field-message admin alerts.
        </footer>
      </div>
    </main>
  );
}
