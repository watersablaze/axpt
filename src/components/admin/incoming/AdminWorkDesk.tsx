import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { prisma } from "@/infrastructure/db/prisma";
import IncomingRefresh from "../../../../app/admin/incoming/IncomingRefresh";



const PAGE_SIZE = 25;
const lanes = ["access", "transactions", "field", "general"] as const;
type Lane = typeof lanes[number];
type Row = { id: string; title: string; detail: string; status: string; at: Date; href: string; action: string };
const titles: Record<Lane, string> = {
  access: "Profile & LOI access", transactions: "Submitted LOIs", field: "ARP Field Communications", general: "General inquiries",
};
function href(lane: Lane, page = 1) { return `/admin/incoming?lane=${lane}&page=${page}`; }

export default async function AdminWorkDesk({ searchParams }: {
  searchParams?: Promise<{ lane?: string; page?: string; item?: string }>;
}) {
  const principal = await getPrincipal();
  if (!principal) redirect("/login?next=%2Fadmin%2Fincoming");
  if (!isAdmin(principal)) notFound();
  const params = await searchParams;
  const lane: Lane = lanes.find(value => value === params?.lane) ?? "access";
  const rawPage = Number(params?.page ?? "1");
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 10000 ? rawPage : 1;
  const skip = (page - 1) * PAGE_SIZE;
  const accessAllowed = principal.permissions.includes(PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE);
  const fieldAllowed = principal.permissions.includes(PERMISSIONS.COMMUNICATIONS_ACCESS);
  let rows: Row[] = [];
  let failed = false;
  const allowed = lane === "access" ? accessAllowed : lane === "field" ? fieldAllowed : true;
  try {
    if (lane === "access" && accessAllowed) {
      const records = await prisma.institutionalAccessRequest.findMany({
        where: { status: "PENDING", scope: { in: ["PROFILE_VIEW", "LOI_INTAKE_ACCESS"] } },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }], skip, take: PAGE_SIZE + 1,
        select: { id: true, requesterName: true, requesterEmail: true, institutionalAffiliation: true, scope: true, createdAt: true },
      });
      rows = records.map((record: {
        id: string; requesterName: string; requesterEmail: string;
        institutionalAffiliation: string | null; scope: string; createdAt: Date;
      }) => ({ id: record.id, title: record.requesterName,
        detail: `${record.requesterEmail} · ${record.institutionalAffiliation}`,
        status: record.scope === "PROFILE_VIEW" ? "Profile access · Pending decision" : "LOI access · Pending decision",
        at: record.createdAt, href: `/admin/institutional-access?requestId=${encodeURIComponent(record.id)}`,
        action: "Review access request" }));
    } else if (lane === "transactions") {
      const records = await prisma.transactionIntake.findMany({
        where: { status: { in: ["SUBMITTED", "UNDER_REVIEW", "NEEDS_CLARIFICATION"] } },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }], skip, take: PAGE_SIZE + 1,
        select: { id: true, reference: true, submitterName: true, submitterEmail: true, status: true, createdAt: true },
      });
      rows = records.map((record: {
        id: string; reference: string; submitterName: string;
        submitterEmail: string; status: string; createdAt: Date;
      }) => ({ id: record.id, title: record.reference,
        detail: `${record.submitterName} · ${record.submitterEmail}`, status: record.status.replaceAll("_", " "),
        at: record.createdAt, href: `/admin/transaction-intakes/${encodeURIComponent(record.id)}`, action: "Review transaction" }));
    } else if (lane === "general") {
      const records = await prisma.frenchWardInquiry.findMany({
        where: { status: { in: ["OPEN", "IN_REVIEW"] } },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }], skip, take: PAGE_SIZE + 1,
        select: { id: true, name: true, email: true, organization: true, subject: true, status: true, createdAt: true },
      });
      rows = records.map((record: { id: string; name: string; email: string; organization: string; subject: string; status: string; createdAt: Date }) => ({
        id: record.id, title: record.subject, detail: `${record.name} · ${record.email} · ${record.organization}`,
        status: record.status.replaceAll("_", " "), at: record.createdAt,
        href: `/admin/incoming/general/${encodeURIComponent(record.id)}`, action: "Review inquiry",
      }));
    } else if (lane === "field" && fieldAllowed) {
      const records = await prisma.communicationConversation.findMany({
        where: { status: "ACTIVE", members: { some: { userId: principal.userId, leftAt: null } },
          operationalRoom: { is: { clientRoomId: { startsWith: "arp-field:" } } } },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }], skip, take: PAGE_SIZE + 1,
        select: { id: true, title: true, updatedAt: true,
          members: { where: { userId: principal.userId, leftAt: null }, select: { lastReadMessage: { select: { createdAt: true } } } },
          messages: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1,
            select: { senderUserId: true, createdAt: true, body: true } } },
      });
      rows = records.map((record: {
        id: string; title: string | null; updatedAt: Date;
        members: Array<{ lastReadMessage: { createdAt: Date } | null }>;
        messages: Array<{
          senderUserId: string; createdAt: Date; body: string;
        }>;
      }) => {
        const latest = record.messages[0];
        const lastRead = record.members[0]?.lastReadMessage?.createdAt;
        const unread = latest && latest.senderUserId !== principal.userId && (!lastRead || latest.createdAt > lastRead);
        return { id: record.id, title: record.title || "Representative field conversation",
          detail: latest?.body.slice(0, 220) || "No messages recorded.",
          status: unread ? "New incoming message" : latest?.senderUserId === principal.userId ? "Latest message sent by you" : "Latest incoming message read",
          at: latest?.createdAt ?? record.updatedAt,
          href: "/admin/communications", action: "Open Communications to review and reply" };
      });
    }
  } catch (error: unknown) {
    const failure = error as {
      name?: string;
      code?: string;
      meta?: { modelName?: string; table?: string };
    };
    console.error("[ADMIN_WORK_QUEUE_FAILED]", {
      lane,
      name: failure?.name,
      code: failure?.code,
      model: failure?.meta?.modelName,
      table: failure?.meta?.table,
    });
    failed = true;
  }

  const more = rows.length > PAGE_SIZE;
  const visible = rows.slice(0, PAGE_SIZE);
  const selected = visible.find(row => row.id === params?.item) ?? visible[0];
  const checkedAt = new Date().toISOString();
  const notes: Record<Lane, string> = {
    access: "Pending access decisions · oldest first",
    transactions: "Submitted, under review, or awaiting clarification · oldest first",
    general: "Open inquiries and inquiries in review · oldest first",
    field: "Active representative conversations · latest activity first",
  };

  function selectHref(id: string) {
    return `${href(lane, page)}&item=${encodeURIComponent(id)}`;
  }

  return (
    <section aria-labelledby="work-desk-title" className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[.2em] text-amber-200/80">
            French-Ward · Operator desk
          </p>
          <h2 id="work-desk-title" className="mt-2 text-2xl font-medium tracking-tight text-white">
            Incoming work
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            Review the context. Open the record. Take the next action.
          </p>
        </div>
        <Link
          href="/admin/incoming/alerts"
          className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:border-amber-300/60 hover:text-white"
        >
          Check alert delivery →
        </Link>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-neutral-800 py-3">
        <nav aria-label="Incoming work categories" className="flex flex-wrap gap-1">
          {lanes.map(value => (
            <Link
              key={value}
              href={href(value)}
              aria-current={lane === value ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 ${
                lane === value
                  ? "bg-amber-100 text-neutral-950"
                  : "text-neutral-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {titles[value]}
            </Link>
          ))}
        </nav>
        <IncomingRefresh />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
        <p>{notes[lane]}</p>
        <p>
          Checked <time dateTime={checkedAt}>{checkedAt.slice(11, 16)} UTC</time>
        </p>
      </div>

      {!allowed ? (
        <div role="status" className="rounded-xl border border-neutral-700 p-6 text-sm text-neutral-300">
          Your session does not have permission to open this category.
        </div>
      ) : failed ? (
        <div role="status" className="rounded-xl border border-amber-300/30 bg-amber-200/5 p-6 text-sm text-amber-100">
          This queue could not be loaded. Refresh to retry. Its contents are unavailable, not empty.
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 px-6 py-12">
          <h3 className="text-lg text-neutral-200">
            {page === 1 ? "No work listed in this category" : "No records on this page"}
          </h3>
          <p className="mt-2 text-sm text-neutral-500">
            {page === 1
              ? "Choose another category or refresh to check for new arrivals."
              : "Use Previous below to return to earlier records."}
          </p>
        </div>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,.85fr)]">
          <div className="min-w-0 overflow-hidden rounded-xl border border-neutral-800">
            <div className="flex justify-between gap-3 border-b border-neutral-800 bg-white/[.025] px-4 py-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400">Work queue</h3>
              <span className="text-xs text-neutral-500">
                {visible.length} shown{more ? " · more available" : ""}
              </span>
            </div>
            <ul className="divide-y divide-neutral-800">
              {visible.map(row => (
                <li key={row.id}>
                  <Link
                    href={selectHref(row.id)}
                    scroll={false}
                    aria-current={selected?.id === row.id ? "true" : undefined}
                    className={`block border-l-2 px-4 py-4 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 ${
                      selected?.id === row.id
                        ? "border-amber-200 bg-amber-100/[.055]"
                        : "border-transparent hover:bg-white/[.035]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 break-words text-sm font-medium text-neutral-100">{row.title}</p>
                      <time dateTime={row.at.toISOString()} className="shrink-0 text-[11px] tabular-nums text-neutral-500">
                        {row.at.toISOString().slice(0, 10)}
                      </time>
                    </div>
                    <p className="mt-2 line-clamp-2 break-words text-xs leading-5 text-neutral-400">{row.detail}</p>
                    <p className="mt-3 text-[11px] text-amber-100/80">{row.status}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {selected && (
            <aside aria-labelledby="selected-work-title" className="min-w-0 rounded-xl border border-neutral-700 bg-white/[.025] p-5 sm:p-6 xl:sticky xl:top-3">
              <p className="text-[10px] uppercase tracking-[.18em] text-neutral-500">Selected record</p>
              <h3 id="selected-work-title" className="mt-3 break-words text-xl font-medium leading-7 text-white">
                {selected.title}
              </h3>
              <p className="mt-3 text-xs text-amber-100">{selected.status}</p>
              <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-neutral-300">
                {selected.detail}
              </p>
              <dl className="mt-6 border-t border-neutral-700 pt-4 text-xs">
                <dt className="text-neutral-500">Recorded activity</dt>
                <dd className="mt-1 text-neutral-300">
                  <time dateTime={selected.at.toISOString()}>
                    {selected.at.toISOString().replace("T", " ").slice(0, 16)} UTC
                  </time>
                </dd>
              </dl>
              <Link
                href={selected.href}
                className="mt-6 inline-flex max-w-full items-center rounded-lg bg-amber-100 px-4 py-3 text-sm font-medium text-neutral-950 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
              >
                {selected.action} →
              </Link>
              <p className="mt-4 text-xs leading-5 text-neutral-500">
                {lane === "field"
                  ? "Open Communications to read and reply. This preview does not mark the conversation read."
                  : "Viewing this summary leaves the record unchanged. Review and decisions happen in the record."}
              </p>
            </aside>
          )}
        </div>
      )}

      {allowed && !failed && (
        <nav aria-label="Queue pages" className="flex items-center justify-between border-t border-neutral-800 pt-4 text-sm">
          <div>
            {page > 1 && <Link href={href(lane, page - 1)} className="text-neutral-300 hover:text-white">← Previous</Link>}
          </div>
          <span className="text-xs text-neutral-500">Page {page}</span>
          <div>
            {more && <Link href={href(lane, page + 1)} className="text-neutral-300 hover:text-white">Next →</Link>}
          </div>
        </nav>
      )}

      <footer className="flex flex-wrap gap-x-5 gap-y-2 pb-2 text-xs text-neutral-500">
        <Link href="/admin" className="hover:text-neutral-200">Administration overview</Link>
        <Link href="/admin/incoming/general" className="hover:text-neutral-200">Inquiry archive</Link>
        <Link href="/admin/representative-program" className="hover:text-neutral-200">Representative Program</Link>
        <Link href="/admin/transaction-intakes" className="hover:text-neutral-200">All transaction intakes</Link>
      </footer>
    </section>
  );
}
