import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    inquiryId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

type InquiryEvent = {
  id: string;
  createdAt: Date;
  fromStatus: string | null;
  toStatus: string;
  note: string;
  actorUserId: string | null;
};

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function statusTone(status: string) {
  switch (status) {
    case "OPEN":
      return "border-cyan-800/50 bg-cyan-950/20 text-cyan-200";
    case "IN_REVIEW":
      return "border-amber-800/50 bg-amber-950/20 text-amber-200";
    case "CLOSED":
      return "border-neutral-700 bg-neutral-900/60 text-neutral-400";
    default:
      return "border-neutral-700 bg-neutral-900/60 text-neutral-300";
  }
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function GeneralInquiryPage({
  params,
  searchParams,
}: Props) {
  const principal = await getPrincipal();

  if (!principal) {
    redirect("/login?next=/admin/incoming");
  }

  if (!isAdmin(principal)) {
    notFound();
  }

  const { inquiryId } =
    await params;

  if (
    !/^[a-f0-9-]{36}$/i.test(
      inquiryId
    )
  ) {
    notFound();
  }

  const record =
    await prisma.frenchWardInquiry.findUnique({
      where: {
        id: inquiryId,
      },
      include: {
        events: {
          orderBy: [
            {
              createdAt: "desc",
            },
            {
              id: "desc",
            },
          ],
        },
      },
    });

  if (!record) {
    notFound();
  }

  const query =
    await searchParams;

  const copy =
    await prisma.emailLog.findFirst({
      where: {
        type:
          "FRENCH_WARD_INQUIRY_COPY_V1:" +
          inquiryId,
      },
      orderBy: {
        id: "desc",
      },
      select: {
        status: true,
      },
    });

  const events =
    record.events as InquiryEvent[];

  const responseSubject =
    `Re: ${record.subject}`;

  return (
    <main className="min-h-full bg-[#090d10] text-neutral-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
          <Link
            href="/admin/incoming?lane=general"
            className="text-[10px] uppercase tracking-[0.14em] text-neutral-500 transition hover:text-neutral-200"
          >
            ← General inquiries
          </Link>

          <div
            className={`rounded-sm border px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] ${statusTone(
              record.status
            )}`}
          >
            {statusLabel(
              record.status
            )}
          </div>
        </div>

        <header className="border-b border-neutral-800/80 pb-5">
          <p className="text-[9px] uppercase tracking-[0.19em] text-amber-300/80">
            French-Ward · Inquiry Record
          </p>

          <h1 className="mt-2 max-w-4xl text-xl font-medium leading-tight text-white sm:text-2xl">
            {record.subject}
          </h1>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-neutral-500">
            <span>
              Received{" "}
              {formatDate(
                record.createdAt
              )}
            </span>

            <span className="hidden text-neutral-800 sm:inline">
              ·
            </span>

            <span className="font-mono">
              {record.id}
            </span>
          </div>
        </header>

        {query?.error ? (
          <div
            role="alert"
            className="mt-5 border-l-2 border-amber-400 bg-amber-950/15 px-4 py-3 text-xs leading-5 text-amber-100"
          >
            {query.error ===
            "conflict"
              ? "Another update was recorded. Review the current status and submit again."
              : "The update could not be recorded. Check the note and try again."}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
          <div className="min-w-0 space-y-6">
            <section
              aria-labelledby="inquiry-message-heading"
              className="border border-neutral-800/70 bg-[#0c1217]"
            >
              <div className="border-b border-neutral-800/70 px-4 py-3 sm:px-5">
                <p className="text-[9px] uppercase tracking-[0.16em] text-neutral-600">
                  Sender
                </p>

                <h2
                  id="inquiry-message-heading"
                  className="mt-1 text-base font-medium text-white"
                >
                  {record.name}
                </h2>

                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-neutral-500">
                  <span className="break-all text-neutral-300">
                    {record.email}
                  </span>

                  {record.organization ? (
                    <>
                      <span className="text-neutral-800">
                        ·
                      </span>

                      <span>
                        {record.organization}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="px-4 py-5 sm:px-5 sm:py-6">
                <p className="whitespace-pre-wrap break-words text-[14px] leading-7 text-neutral-200">
                  {record.message}
                </p>
              </div>
            </section>

            <section
              aria-labelledby="history-heading"
              className="border-t border-neutral-800/70 pt-5"
            >
              <div className="mb-4">
                <p className="text-[9px] uppercase tracking-[0.17em] text-neutral-600">
                  Record
                </p>

                <h2
                  id="history-heading"
                  className="mt-1 text-base font-medium text-white"
                >
                  Review history
                </h2>
              </div>

              {events.length === 0 ? (
                <p className="text-xs text-neutral-600">
                  No operator review events have been recorded yet.
                </p>
              ) : (
                <ol className="divide-y divide-neutral-900 border-y border-neutral-900">
                  {events.map(
                    event => (
                      <li
                        key={
                          event.id
                        }
                        className="grid gap-2 py-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-5"
                      >
                        <div className="text-[10px] leading-5 text-neutral-600">
                          <p>
                            {formatDate(
                              event.createdAt
                            )}
                          </p>

                          <p className="mt-1 break-all font-mono text-[9px] text-neutral-700">
                            {event.actorUserId ||
                              "Public submission"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-[0.12em] text-amber-300/80">
                            {event.fromStatus
                              ? `${statusLabel(
                                  event.fromStatus
                                )} → `
                              : ""}
                            {statusLabel(
                              event.toStatus
                            )}
                          </p>

                          <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-neutral-400">
                            {event.note}
                          </p>
                        </div>
                      </li>
                    )
                  )}
                </ol>
              )}
            </section>
          </div>

          <aside className="min-w-0 space-y-5 xl:sticky xl:top-5 xl:self-start">
            <section className="border border-neutral-800/70 bg-[#0b1116] p-4">
              <p className="text-[9px] uppercase tracking-[0.17em] text-neutral-600">
                Correspondence
              </p>

              <h2 className="mt-1 text-sm font-medium text-white">
                Respond externally
              </h2>

              <p className="mt-2 text-xs leading-5 text-neutral-500">
                Reply from the French-Ward mailbox. Opening the mail link does not send a message or change this record.
              </p>

              <a
                className="mt-4 inline-flex min-h-9 items-center border border-cyan-800/50 bg-cyan-950/10 px-3 text-[10px] uppercase tracking-[0.12em] text-cyan-200 transition hover:border-cyan-600/60 hover:text-white"
                href={`mailto:${encodeURIComponent(
                  record.email
                )}?subject=${encodeURIComponent(
                  responseSubject
                )}`}
              >
                Open email reply
              </a>

              <div className="mt-4 border-t border-neutral-900 pt-3 text-[10px] leading-5 text-neutral-600">
                <p>
                  French-Ward mailbox copy
                </p>

                <p className="mt-1 text-neutral-400">
                  {copy?.status ||
                    "No receipt recorded"}
                </p>

                <Link
                  href="/admin/incoming/alerts"
                  className="mt-2 inline-block text-cyan-300/75 hover:text-cyan-200"
                >
                  Review alert delivery →
                </Link>
              </div>
            </section>

            <section className="border border-amber-900/35 bg-amber-950/[0.07] p-4">
              <p className="text-[9px] uppercase tracking-[0.17em] text-amber-300/70">
                Operator record
              </p>

              <h2 className="mt-1 text-sm font-medium text-white">
                Record review outcome
              </h2>

              <p className="mt-2 text-xs leading-5 text-neutral-500">
                This form updates the inquiry record. A review note is required for every status transition or reaffirmation.
              </p>

              <form
                method="post"
                action={`/api/admin/incoming/general/${record.id}`}
                className="mt-4 space-y-4"
              >
                <input
                  type="hidden"
                  name="revision"
                  value={
                    record.revision
                  }
                />

                <label className="block">
                  <span className="block text-[9px] uppercase tracking-[0.14em] text-neutral-600">
                    Status
                  </span>

                  <select
                    name="status"
                    defaultValue={
                      record.status
                    }
                    className="mt-2 w-full border border-neutral-700/70 bg-[#080d11] px-3 py-2 text-xs text-neutral-200 outline-none focus:border-amber-700/70"
                  >
                    <option value="OPEN">
                      Open
                    </option>
                    <option value="IN_REVIEW">
                      In review
                    </option>
                    <option value="CLOSED">
                      Closed
                    </option>
                  </select>
                </label>

                <label className="block">
                  <span className="block text-[9px] uppercase tracking-[0.14em] text-neutral-600">
                    Review note · required
                  </span>

                  <textarea
                    name="note"
                    required
                    maxLength={
                      2000
                    }
                    rows={5}
                    className="mt-2 block w-full resize-y border border-neutral-700/70 bg-[#080d11] px-3 py-2.5 text-xs leading-5 text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-amber-700/70"
                    placeholder="Record your review, response, next step, or reason for closing."
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex min-h-9 items-center border border-amber-700/50 bg-amber-950/15 px-3 text-[10px] uppercase tracking-[0.13em] text-amber-100 transition hover:border-amber-500/70 hover:bg-amber-950/25"
                >
                  Save review
                </button>
              </form>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
