import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { prisma } from "@/infrastructure/db/prisma";
import IncomingRefresh from "./IncomingRefresh";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const PAGE_SIZE = 25;
const lanes = ["access", "transactions", "field", "general"] as const;
type Lane = typeof lanes[number];
type Row = { id: string; title: string; detail: string; status: string; at: Date; href: string; action: string };
const titles: Record<Lane, string> = {
  access: "Profile & LOI access", transactions: "Submitted LOIs", field: "ARP Field Communications", general: "General inquiries",
};
function href(lane: Lane, page = 1) { return `/admin/incoming?lane=${lane}&page=${page}`; }

export default async function IncomingAdminPage({ searchParams }: {
  searchParams?: Promise<{ lane?: string; page?: string }>;
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
      rows = records.map(record => ({ id: record.id, title: record.requesterName,
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
      rows = records.map(record => ({ id: record.id, title: record.reference,
        detail: `${record.submitterName} · ${record.submitterEmail}`, status: record.status.replaceAll("_", " "),
        at: record.createdAt, href: `/admin/transaction-intakes/${encodeURIComponent(record.id)}`, action: "Review transaction" }));
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
      rows = records.map(record => {
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
  } catch {
    failed = true;
  }
  const more = rows.length > PAGE_SIZE;
  return <main className="mx-auto max-w-6xl space-y-6 px-5 py-7 text-slate-100">
    <header className="space-y-3 border-b border-slate-700 pb-5">
      <p className="text-xs uppercase tracking-[.2em] text-amber-200">French-Ward · Administration</p>
      <h1 className="text-3xl font-semibold">Incoming work</h1>
      <p className="max-w-3xl text-sm leading-6 text-slate-300">Review requests and representative messages through their existing decision and reply controls. Reading, replying, and resolving are separate actions.</p>
      <IncomingRefresh />
    </header>
    <nav aria-label="Incoming work categories" className="flex flex-wrap gap-2">{lanes.map(value =>
      <Link key={value} href={href(value)} aria-current={lane === value ? "page" : undefined}
        className={`rounded border px-3 py-2 text-sm ${lane === value ? "border-amber-200 bg-amber-200/10 text-amber-100" : "border-slate-600 text-slate-300"}`}>{titles[value]}</Link>)}</nav>
    <section aria-labelledby="incoming-lane" className="space-y-4">
      <h2 id="incoming-lane" className="text-xl font-medium">{titles[lane]}</h2>
      {lane === "access" && <p className="text-sm text-slate-400">Pending decisions, oldest first. Approved and declined records remain in Institutional Access.</p>}
      {lane === "transactions" && <p className="text-sm text-slate-400">Submitted, under review, and awaiting clarification, oldest first. Access requests are listed separately.</p>}
      {lane === "field" && <p className="text-sm text-slate-400">Active ARP conversations you belong to, newest activity first. The label describes the latest message; it is not an unresolved-task count. Replies remain in Communications.</p>}
      {!allowed ? <p role="status" className="rounded border border-slate-600 p-4">Your session does not have the permission required for this category.</p>
        : failed ? <p role="alert" className="rounded border border-amber-400 p-4">This queue could not be loaded. Refresh to retry; do not interpret this as an empty inbox.</p>
        : lane === "general" ? <div className="space-y-3 rounded border border-amber-500/40 p-5">
            <h3 className="font-semibold text-amber-200">Mailbox review required</h3>
            <p className="text-sm leading-6">Public inquiries currently send email to french-ward@axpt.io. They are not stored as reviewable Admin requests, so this inbox cannot report their count or resolution.</p>
            <p className="text-sm text-slate-300">Review that mailbox directly. Durable inquiry tracking and an Admin reply/disposition workflow remain to be implemented.</p>
          </div>
        : rows.length === 0 ? <p className="rounded border border-slate-700 p-5">{page === 1 ? "No records match this category." : "No records on this page. Return to the previous page."}</p>
        : <ul className="space-y-3">{rows.slice(0, PAGE_SIZE).map(row => <li key={row.id} className="rounded border border-slate-700 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3"><h3 className="font-semibold">{row.title}</h3><span className="text-xs text-amber-200">{row.status}</span></div>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-300">{row.detail}</p>
          <p className="mt-2 text-xs text-slate-400"><time dateTime={row.at.toISOString()}>{row.at.toISOString().replace("T", " ").slice(0, 16)} UTC</time></p>
          <Link href={row.href} className="mt-3 inline-block text-sm text-cyan-200 underline underline-offset-4">{row.action} →</Link>
        </li>)}</ul>}
      {allowed && !failed && lane !== "general" && <nav aria-label="Inbox pages" className="flex items-center gap-5 text-sm">
        {page > 1 && <Link href={href(lane, page - 1)} className="underline">← Previous</Link>}<span>Page {page}</span>
        {more && <Link href={href(lane, page + 1)} className="underline">Next →</Link>}
      </nav>}
    </section>
    <aside className="space-y-2 border-t border-slate-700 pt-5 text-sm text-slate-300">
      <h2 className="font-semibold text-amber-200">Notification coverage</h2>
      <p>Profile/LOI access requests and ARP field messages do not currently send an Admin email alert through their submission handlers. Check this inbox while notification delivery is being completed.</p>
      <p>Submitted LOIs have an internal email path; sending depends on configured recipients and delivery mode. This page does not establish email delivery.</p>
    </aside>
    <footer className="flex flex-wrap gap-5 text-sm text-cyan-200">
      <Link href="/admin/representative-program">Representative Program</Link>
      <Link href="/admin/representative-program/buyer-dossiers">Buyer introductions</Link>
      <Link href="/admin/transaction-intakes">All transaction intakes</Link>
    </footer>
  </main>;
}
