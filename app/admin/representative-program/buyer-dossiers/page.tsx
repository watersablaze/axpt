import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const formatDate = (date: Date) => new Intl.DateTimeFormat("en-GB", {
  day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
}).format(date);

function accessStanding(row: {
  revokedAt: Date | null; expiresAt: Date;
  items: Array<{ grant: { expiresAt: Date; revokedAt: Date | null } }>;
  loiAccessGrant: { expiresAt: Date; revokedAt: Date | null } | null;
}, now: Date) {
  if (row.revokedAt) return "Revoked";
  if (row.expiresAt <= now) return "Expired";
  const grants = [...row.items.map(item => item.grant),
    ...(row.loiAccessGrant ? [row.loiAccessGrant] : [])];
  if (!row.items.length || row.items.length > 6 ||
      grants.some(grant => grant.revokedAt || grant.expiresAt <= now)) return "Restricted";
  return "Valid";
}

export default async function BuyerDossiersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const principal = await getPrincipal();
  if (!principal) redirect("/login?next=%2Fadmin%2Frepresentative-program%2Fbuyer-dossiers");
  if (!isAdmin(principal)) notFound();

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 120) : "";
  const filter = ["all", "current", "historical", "attention"].includes(params.filter ?? "")
    ? params.filter! : "all";
  const now = new Date();
  const rows = await prisma.representativeBuyerDossier.findMany({
    where: q ? { OR: [
      { recipientName: { contains: q, mode: "insensitive" } },
      { recipientEmail: { contains: q, mode: "insensitive" } },
      { recipientOrganization: { contains: q, mode: "insensitive" } },
      { participant: { displayName: { contains: q, mode: "insensitive" } } },
      { id: { contains: q, mode: "insensitive" } },
    ] } : undefined,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 50,
    select: {
      id: true, recipientName: true, recipientEmail: true,
      recipientOrganization: true, purpose: true, createdAt: true, expiresAt: true,
      revokedAt: true, recipientDeliveryStatus: true, adminDeliveryStatus: true,
      participant: { select: { displayName: true } },
      items: { select: { grant: { select: { revokedAt: true, expiresAt: true, firstAccessAt: true } } } },
      loiAccessGrant: { select: { revokedAt: true, expiresAt: true, firstAccessAt: true } },
    },
  });
  const mapped = rows.map(row => ({
    ...row,
    access: accessStanding(row, now),
    accessedCount: row.items.filter(item => item.grant.firstAccessAt !== null).length,
  }));
  const visible = mapped.filter(row =>
    filter === "current" ? row.access === "Valid"
    : filter === "historical" ? ["Expired", "Revoked"].includes(row.access)
    : filter === "attention" ? row.access === "Restricted" ||
      ["FAILED", "DELIVERY_UNKNOWN", "SENDING"].includes(row.recipientDeliveryStatus)
    : true
  );
  const tabs = [
    { key: "all", label: "All" },
    { key: "current", label: "Current grants" },
    { key: "historical", label: "Expired / revoked" },
    { key: "attention", label: "Needs attention" },
  ];

  return <main className="min-h-screen bg-[#0c1219] px-5 py-9 text-slate-100 sm:px-9">
    <div className="mx-auto max-w-7xl">
      <nav className="mb-7 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
        <Link href="/admin/representative-program" className="hover:text-white">Representative Program</Link>
        <Link href="/admin/institutional-access" className="underline underline-offset-4 hover:text-white">Institutional Access Administration</Link>
      </nav>
      <header className="mb-7 border-b border-slate-700/70 pb-7">
        <p className="mb-2 text-xs font-semibold tracking-[0.22em] text-amber-200/80">FRENCH-WARD / COMMERCIAL ADMINISTRATION</p>
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">Buyer Dossiers</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">Documentary issuance, recipient authorization, and delivery oversight. An accepted notice is not proof that a recipient viewed a document.</p>
      </header>
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-md border border-slate-700 bg-[#131e27] px-3 py-2.5">
          <p className="text-xs uppercase tracking-widest text-slate-400">Visible dossiers</p>
          <p className="mt-1 text-xl font-semibold">{mapped.length}</p>
        </div>
        <div className="rounded-md border border-slate-700 bg-[#131e27] px-3 py-2.5">
          <p className="text-xs uppercase tracking-widest text-slate-400">Valid access</p>
          <p className="mt-1 text-xl font-semibold">{mapped.filter(row => row.access === "Valid").length}</p>
        </div>
        <div className="rounded-md border border-slate-700 bg-[#131e27] px-3 py-2.5">
          <p className="text-xs uppercase tracking-widest text-slate-400">Delivery attention</p>
          <p className="mt-1 text-xl font-semibold">{mapped.filter(row => ["FAILED", "DELIVERY_UNKNOWN", "SENDING"].includes(row.recipientDeliveryStatus)).length}</p>
        </div>
      </div>
      <p className="mb-4 text-xs text-slate-500">Counts cover this query's latest 50 records, not the full institutional register. Valid means the dossier and grant dates are current; publication availability is rechecked separately.</p>
      <form method="GET" className="mb-3 flex flex-wrap items-end gap-2">
        <label className="flex min-w-[220px] flex-1 flex-col gap-2 text-xs text-slate-300">
          Search recipient, organization, representative, or dossier ID
          <input name="q" defaultValue={q} maxLength={120} placeholder="Search dossiers"
            className="w-full rounded-md border border-slate-600 bg-[#101923] px-3 py-2 text-sm text-white placeholder:text-slate-500"/>
        </label>
        <input type="hidden" name="filter" value={filter}/>
        <button type="submit" className="rounded-md border border-slate-400 px-4 py-2 text-sm font-semibold hover:bg-slate-800">Search</button>
        {q && <Link href="/admin/representative-program/buyer-dossiers" className="px-2 py-3 text-sm text-slate-300 underline">Clear</Link>}
      </form>
      <nav aria-label="Dossier status filters" className="mb-3 flex flex-wrap gap-1.5">
        {tabs.map(tab => <Link key={tab.key}
          href={`?filter=${tab.key}${q ? "&q=" + encodeURIComponent(q) : ""}`}
          aria-current={filter === tab.key ? "page" : undefined}
          className={`rounded-md border px-2.5 py-1.5 text-xs font-medium ${filter === tab.key ? "border-slate-200 bg-slate-200 text-slate-950" : "border-slate-700 text-slate-300 hover:border-slate-400"}`}>
          {tab.label}
        </Link>)}
      </nav>
      <div className="overflow-hidden rounded-lg border border-slate-700">
        <div className="grid grid-cols-12 gap-3 border-b border-slate-700 bg-[#15222b] px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          <div className="col-span-6 sm:col-span-4">Recipient / introduction</div>
          <div className="col-span-3 hidden sm:block">Documentary access</div>
          <div className="col-span-3 hidden sm:block">Delivery</div>
          <div className="col-span-6 sm:col-span-2">Issued / detail</div>
        </div>
        {visible.map(row => <article key={row.id} className="grid grid-cols-12 gap-3 border-b border-slate-800 bg-[#0f1821] px-4 py-3 last:border-0 hover:bg-[#182530]">
          <div className="col-span-6 sm:col-span-4">
            <Link href={`/admin/representative-program/buyer-dossiers/${encodeURIComponent(row.id)}`} className="font-semibold text-slate-100 underline-offset-4 hover:underline">{row.recipientName}</Link>
            <p className="mt-1 break-all text-xs text-slate-400">{row.recipientEmail}</p>
            <p className="mt-2 text-xs text-slate-400">{row.recipientOrganization} · via {row.participant.displayName}</p>
          </div>
          <div className="col-span-3 hidden sm:block">
            <p className={row.access === "Valid" ? "font-medium text-emerald-300" : "font-medium text-amber-200"}>{row.access}</p>
            <p className="mt-1 text-xs text-slate-400">{row.items.length} grants · {row.accessedCount} first-access timestamps · LOI {row.loiAccessGrant ? "granted" : "not granted"}</p>
            <p className="mt-0.5 text-xs text-slate-500">Expires {formatDate(row.expiresAt)} UTC</p>
          </div>
          <div className="col-span-3 hidden sm:block">
            <p className={`text-sm font-medium ${["FAILED", "DELIVERY_UNKNOWN", "SENDING"].includes(row.recipientDeliveryStatus) ? "text-amber-200" : "text-slate-200"}`}>{row.recipientDeliveryStatus.replaceAll("_", " ")}</p>
            <p className="mt-0.5 text-xs text-slate-400">Recipient notice · provider status</p>
          </div>
          <div className="col-span-6 sm:col-span-2">
            <p className="text-xs text-slate-400">{formatDate(row.createdAt)}</p>
            <Link href={`/admin/representative-program/buyer-dossiers/${encodeURIComponent(row.id)}`}
              className="mt-2 inline-block text-xs font-semibold text-sky-200 underline underline-offset-4">View record</Link>
            <p className="mt-1 text-xs text-slate-500 sm:hidden">{row.access} · {row.recipientDeliveryStatus}</p>
          </div>
        </article>)}
        {visible.length === 0 && <p className="p-8 text-sm text-slate-400">No dossiers match this view. Historical records are not deleted.</p>}
      </div>
      <p className="mt-5 text-xs leading-6 text-slate-500">Showing up to 50 most recent matches before status filtering. Search by identity or dossier ID for older records. All statuses are derived from current recorded state; no commercial transaction standing is inferred.</p>
    </div>
  </main>;
}
