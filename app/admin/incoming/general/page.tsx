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

const PAGE_SIZE = 25;

type Props = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

type InquiryRow = {
  id: string;
  name: string;
  subject: string;
  status: string;
  createdAt: Date;
};

function statusLabel(
  status: string
) {
  return status.replaceAll(
    "_",
    " "
  );
}

function statusTone(
  status: string
) {
  switch (status) {
    case "OPEN":
      return "text-cyan-300";
    case "IN_REVIEW":
      return "text-amber-300";
    case "CLOSED":
      return "text-neutral-600";
    default:
      return "text-neutral-500";
  }
}

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

export default async function GeneralInquiryArchive({
  searchParams,
}: Props) {
  const principal =
    await getPrincipal();

  if (!principal) {
    redirect(
      "/login?next=/admin/incoming"
    );
  }

  if (!isAdmin(principal)) {
    notFound();
  }

  const query =
    await searchParams;

  const requestedPage =
    Number(
      query?.page || 1
    );

  const page =
    Number.isSafeInteger(
      requestedPage
    ) &&
    requestedPage > 0 &&
    requestedPage <= 10000
      ? requestedPage
      : 1;

  const rows =
    (await prisma.frenchWardInquiry.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
      skip:
        (page - 1) *
        PAGE_SIZE,
      take:
        PAGE_SIZE + 1,
      select: {
        id: true,
        name: true,
        subject: true,
        status: true,
        createdAt: true,
      },
    })) as InquiryRow[];

  const more =
    rows.length > PAGE_SIZE;

  const visible =
    rows.slice(
      0,
      PAGE_SIZE
    );

  return (
    <main className="min-h-full bg-[#090d10] text-neutral-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
          <Link
            href="/admin/incoming?lane=general"
            className="text-[10px] uppercase tracking-[0.14em] text-neutral-500 transition hover:text-neutral-200"
          >
            ← Incoming general inquiries
          </Link>

          <span className="text-[9px] uppercase tracking-[0.14em] text-neutral-600">
            Page {page}
          </span>
        </div>

        <header className="border-b border-neutral-800/80 py-5">
          <p className="text-[9px] uppercase tracking-[0.18em] text-amber-300/75">
            French-Ward · Inquiry Registry
          </p>

          <h1 className="mt-2 text-xl font-medium text-white sm:text-2xl">
            General inquiries
          </h1>

          <p className="mt-2 max-w-3xl text-xs leading-5 text-neutral-500">
            Durable inquiry records across open, review, and closed states. Earlier email-only inquiries are not imported into this registry.
          </p>
        </header>

        <section
          aria-labelledby="registry-heading"
          className="mt-6"
        >
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-[9px] uppercase tracking-[0.16em] text-neutral-600">
                Records
              </p>

              <h2
                id="registry-heading"
                className="mt-1 text-base font-medium text-white"
              >
                Inquiry register
              </h2>
            </div>

            <span className="text-[10px] tabular-nums text-neutral-600">
              {visible.length}
              {more ? "+" : ""}
            </span>
          </div>

          {!visible.length ? (
            <div className="border-y border-neutral-900 py-8 text-sm text-neutral-600">
              No records on this page.
            </div>
          ) : (
            <ol className="divide-y divide-neutral-900 border-y border-neutral-900">
              {visible.map(
                row => (
                  <li
                    key={
                      row.id
                    }
                  >
                    <Link
                      href={`/admin/incoming/general/${row.id}`}
                      className="group grid gap-3 py-4 transition hover:bg-white/[0.015] sm:grid-cols-[minmax(0,1fr)_150px_90px] sm:items-center sm:gap-5 sm:px-2"
                    >
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-medium text-neutral-200 transition group-hover:text-white">
                          {row.subject}
                        </h3>

                        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-neutral-600">
                          <span className="truncate text-neutral-500">
                            {row.name}
                          </span>

                          <span className="text-neutral-800">
                            ·
                          </span>

                          <span className="font-mono text-[9px] text-neutral-700">
                            {row.id}
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] leading-5 text-neutral-600 sm:text-right">
                        {formatDate(
                          row.createdAt
                        )}
                      </div>

                      <div
                        className={`text-[9px] uppercase tracking-[0.13em] sm:text-right ${statusTone(
                          row.status
                        )}`}
                      >
                        {statusLabel(
                          row.status
                        )}
                      </div>
                    </Link>
                  </li>
                )
              )}
            </ol>
          )}
        </section>

        <nav
          aria-label="Inquiry archive pages"
          className="mt-5 grid grid-cols-3 items-center border-t border-neutral-900 pt-4 text-[10px]"
        >
          <div>
            {page > 1 ? (
              <Link
                href={`?page=${page - 1}`}
                className="text-neutral-500 transition hover:text-white"
              >
                ← Previous
              </Link>
            ) : null}
          </div>

          <span className="text-center tabular-nums text-neutral-600">
            Page {page}
          </span>

          <div className="text-right">
            {more ? (
              <Link
                href={`?page=${page + 1}`}
                className="text-neutral-500 transition hover:text-white"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </nav>
      </div>
    </main>
  );
}
