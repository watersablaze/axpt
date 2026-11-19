import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { prisma } from "@/infrastructure/db/prisma";
import { BuyerDossierAccessControls } from "../BuyerDossierAccessControls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dateUTC(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    timeZone: "UTC", hour12: false,
  }).format(date) + " UTC";
}

function Standing({ value }: { value: string }) {
  const valid = value === "Valid" || value === "Active";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${valid ?
    "border-emerald-700/70 bg-emerald-900/20 text-emerald-200" :
    "border-slate-600 bg-slate-800/50 text-slate-300"}`}>{value}</span>;
}

export default async function BuyerDossierRecordPage({
  params,
}: { params: Promise<{ dossierId: string }> }) {
  const principal = await getPrincipal();
  const { dossierId } = await params;
  if (!principal) redirect("/login?next=" +
    encodeURIComponent("/admin/representative-program/buyer-dossiers/" + dossierId));
  if (!isAdmin(principal)) notFound();
  if (!dossierId || dossierId.length > 191) notFound();

  const row = await prisma.representativeBuyerDossier.findUnique({
    where: { id: dossierId },
    select: {
      id: true, recipientName: true, recipientEmail: true, recipientOrganization: true,
      recipientUserId: true, purpose: true, createdAt: true, updatedAt: true,
      expiresAt: true, revokedAt: true, actorUserId: true, appointmentId: true,
      participant: { select: { displayName: true } },
      actor: { select: { email: true } },
      recipientDeliveryStatus: true, adminDeliveryStatus: true,
      recipientDeliveryError: true, adminDeliveryError: true,
      recipientAttemptedAt: true, adminAttemptedAt: true,
      recipientMessageId: true, adminMessageId: true,
      loiAccessGrant: { select: { id: true, scope: true, resourceReference: true,
        resourceVersion: true, issuedAt: true, expiresAt: true, revokedAt: true,
        firstAccessAt: true, lastAccessAt: true } },
      items: {
        orderBy: [{ resourceReference: "asc" }, { id: "asc" }],
        select: { id: true, label: true, kind: true, resourceReference: true,
          resourceVersion: true, recipientContentHash: true, canDownload: true,
          grant: { select: { id: true, issuedAt: true, expiresAt: true,
            revokedAt: true, firstAccessAt: true, lastAccessAt: true } } },
      },
    },
  });
  if (!row) notFound();

  const now = new Date();
  const grantStatuses = row.items.map(item => item.grant);
  const allGrants = [...grantStatuses, ...(row.loiAccessGrant ? [row.loiAccessGrant] : [])];
  const access = row.revokedAt ? "Revoked" :
    row.expiresAt <= now ? "Expired" :
    row.items.length === 0 || row.items.length > 6 ||
    allGrants.some(grant => grant.revokedAt || grant.expiresAt <= now) ? "Restricted" : "Valid";
  const canManageAccess = principal.permissions.includes(PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE);
  const canExtend = access === "Valid";
  const canRetryNotice = canExtend &&
    row.recipientDeliveryStatus === "FAILED" &&
    row.recipientDeliveryError === "ACCESS_UNAVAILABLE";

  return <main className="min-h-screen bg-[#0c1219] px-5 py-8 text-slate-100 sm:px-9">
    <div className="mx-auto max-w-6xl">
      <nav className="mb-7 flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <Link href="/admin/representative-program" className="hover:text-white">Representative Program</Link>
        <span aria-hidden="true">/</span>
        <Link href="/admin/representative-program/buyer-dossiers" className="hover:text-white">Buyer Dossiers</Link>
        <span aria-hidden="true">/</span>
        <span className="text-slate-200">Individual record</span>
      </nav>
      <header className="border-b border-slate-700 pb-7">
        <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-amber-200/80">FRENCH-WARD / DOCUMENTARY RECEPTION RECORD</p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl">{row.recipientName}</h1>
            <p className="mt-2 text-sm text-slate-400">{row.recipientOrganization} · Introduced by {row.participant.displayName}</p>
          </div>
          <Standing value={access}/>
        </div>
        <p className="mt-4 break-all font-mono text-xs text-slate-500">Dossier ID · {row.id}</p>
      </header>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-700 bg-[#111c25] p-5 sm:p-6">
            <h2 className="font-serif text-xl">01 · Identity & issuance</h2>
            <p className="mt-2 text-xs text-slate-400">This record establishes a recipient invitation, not verified authority to act for a buyer or distribute materials onward.</p>
            <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <div><dt className="text-xs uppercase tracking-widest text-slate-500">Recipient email</dt><dd className="mt-1 break-all text-sm">{row.recipientEmail}</dd></div>
              <div><dt className="text-xs uppercase tracking-widest text-slate-500">Recipient capacity</dt><dd className="mt-1 text-sm">Invited dossier recipient</dd></div>
              <div><dt className="text-xs uppercase tracking-widest text-slate-500">Representative</dt><dd className="mt-1 text-sm">{row.participant.displayName}</dd></div>
              <div><dt className="text-xs uppercase tracking-widest text-slate-500">Issuance channel</dt><dd className="mt-1 text-sm">Representative Program</dd></div>
              <div><dt className="text-xs uppercase tracking-widest text-slate-500">Issued at</dt><dd className="mt-1 text-sm">{dateUTC(row.createdAt)}</dd></div>
              <div><dt className="text-xs uppercase tracking-widest text-slate-500">Access expires</dt><dd className="mt-1 text-sm">{dateUTC(row.expiresAt)}</dd></div>
              <div><dt className="text-xs uppercase tracking-widest text-slate-500">Last record update</dt><dd className="mt-1 text-sm">{dateUTC(row.updatedAt)}</dd></div>
              <div><dt className="text-xs uppercase tracking-widest text-slate-500">Revoked</dt><dd className="mt-1 text-sm">{row.revokedAt ? dateUTC(row.revokedAt) : "No recorded revocation"}</dd></div>
            </dl>
            <div className="mt-5 border-t border-slate-700 pt-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Recorded purpose (verbatim)</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{row.purpose}</p>
            </div>
          </section>

          <section className="rounded-lg border border-slate-700 bg-[#111c25] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif text-xl">02 · Documentary manifest</h2>
              <span className="text-xs text-slate-400">{row.items.length} selected publication{row.items.length === 1 ? "" : "s"}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">Each material retains its own reference, edition, content fingerprint, and access grant. Publication access is not permission to redistribute.</p>
            <div className="mt-5 space-y-3">
              {row.items.map((item, index) => {
                const state = item.grant.revokedAt ? "Revoked" :
                  item.grant.expiresAt <= now ? "Expired" : "Active";
                return <article key={item.id} className="rounded-md border border-slate-700 bg-[#0d1720] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">{String(index+1).padStart(2, "0")} · {item.kind.replaceAll("_", " ")}</p>
                      <h3 className="mt-1 text-sm font-semibold">{item.label}</h3>
                    </div>
                    <Standing value={state}/>
                  </div>
                  <dl className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                    <div><dt>Publication identity</dt><dd className="mt-1 break-all text-slate-200">{item.resourceReference} · Edition {item.resourceVersion}</dd></div>
                    <div><dt>Grant expires</dt><dd className="mt-1 text-slate-200">{dateUTC(item.grant.expiresAt)}</dd></div>
                    <div><dt>Recipient retention</dt><dd className="mt-1 text-slate-200">{item.canDownload ? "Download permitted by grant record" : "View only; no download grant"}</dd></div>
                    <div><dt>First recorded access</dt><dd className="mt-1 text-slate-200">{item.grant.firstAccessAt ? dateUTC(item.grant.firstAccessAt) : "Not recorded"}</dd></div>
                  </dl>
                  <details className="mt-3 border-t border-slate-800 pt-3 text-xs text-slate-400">
                    <summary className="cursor-pointer text-slate-300">Technical record identifiers</summary>
                    <p className="mt-2 break-all">Grant · {item.grant.id}</p>
                    <p className="mt-1 break-all">Content fingerprint · {item.recipientContentHash}</p>
                  </details>
                </article>;
              })}
            </div>
          </section>

          <section className="rounded-lg border border-slate-700 bg-[#111c25] p-5 sm:p-6">
            <h2 className="font-serif text-xl">03 · Commercial Intake</h2>
            {row.loiAccessGrant ? <div className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium">Letter of Intent / Transaction Intake</p>
                <Standing value={row.loiAccessGrant.revokedAt ? "Revoked" : row.loiAccessGrant.expiresAt <= now ? "Expired" : "Active"}/>
              </div>
              <p className="mt-2 text-xs text-slate-400">Separate, explicitly issued LOI access. Submission does not constitute a transaction approval.</p>
              <p className="mt-3 text-xs text-slate-400">Reference · {row.loiAccessGrant.resourceReference} · Edition {row.loiAccessGrant.resourceVersion}</p>
              <p className="mt-1 text-xs text-slate-400">Expires · {dateUTC(row.loiAccessGrant.expiresAt)}</p>
            </div> : <p className="mt-4 text-sm text-slate-400">No LOI access grant is associated with this dossier.</p>}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-700 bg-[#111c25] p-5">
            <h2 className="font-serif text-xl">04 · Delivery</h2>
            <p className="mt-3 text-xs text-slate-400">Provider acceptance is not proof of inbox receipt, reading, comprehension, or agreement.</p>
            <dl className="mt-4 space-y-4 text-sm">
              <div><dt className="text-xs uppercase tracking-widest text-slate-500">Recipient notice</dt><dd className="mt-1">{row.recipientDeliveryStatus.replaceAll("_", " ")}</dd>
                {row.recipientDeliveryError && <p className="mt-1 text-xs text-amber-200">Recorded error · {row.recipientDeliveryError}</p>}</div>
              <div><dt className="text-xs uppercase tracking-widest text-slate-500">Admin notice</dt><dd className="mt-1">{row.adminDeliveryStatus.replaceAll("_", " ")}</dd>
                {row.adminDeliveryError && <p className="mt-1 text-xs text-amber-200">Recorded error · {row.adminDeliveryError}</p>}</div>
              <div><dt className="text-xs uppercase tracking-widest text-slate-500">Last recipient attempt</dt><dd className="mt-1 text-xs">{row.recipientAttemptedAt ? dateUTC(row.recipientAttemptedAt) : "Not recorded"}</dd></div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-700 bg-[#111c25] p-5">
            <h2 className="font-serif text-xl">05 · Recipient evidence</h2>
            <p className="mt-3 text-sm text-slate-300">
              {row.items.some(item => item.grant.firstAccessAt) ? "One or more publication grants record access." : "No publication first-access timestamps are recorded."}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-400">These fields are access evidence only. They do not establish document acceptance or buyer qualification. Full event reconciliation belongs to a separate evidence release.</p>
          </section>

          {canManageAccess && <section className="rounded-lg border border-slate-700 bg-[#111c25] p-4">
            <h2 className="mb-2 font-serif text-xl">06 · Administration</h2>
            <BuyerDossierAccessControls
              dossierId={row.id} recipientName={row.recipientName}
              expiresAt={row.expiresAt.toISOString()}
              canExtend={canExtend} canRetryNotice={canRetryNotice}
            />
          </section>}
          <p className="text-xs leading-5 text-slate-500">Commercial transaction standing, buyer authority, and onward distribution rights are not determined by this dossier.</p>
        </aside>
      </div>
    </div>
  </main>;
}
