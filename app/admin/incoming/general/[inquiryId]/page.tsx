import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
export const dynamic = "force-dynamic";
export default async function GeneralInquiryPage({ params, searchParams }: {
  params: Promise<{ inquiryId: string }>; searchParams?: Promise<{ error?: string }>;
}) {
  const principal = await getPrincipal();
  if (!principal) redirect("/login?next=/admin/incoming");
  if (!isAdmin(principal)) notFound();
  const { inquiryId } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(inquiryId)) notFound();
  const record = await prisma.frenchWardInquiry.findUnique({ where: { id: inquiryId }, include: { events: { orderBy: [{ createdAt: "desc" }, { id: "desc" }] } } });
  if (!record) notFound();
  const query = await searchParams;
  const copy = await prisma.emailLog.findFirst({ where: { type: "FRENCH_WARD_INQUIRY_COPY_V1:" + inquiryId }, orderBy: { id: "desc" }, select: { status: true } });
  return <main className="mx-auto max-w-4xl space-y-6 px-5 py-7 text-slate-100">
    <Link href="/admin/incoming?lane=general" className="text-cyan-200 underline">← General inquiries</Link>
    <header><p className="text-xs uppercase tracking-widest text-amber-200">French-Ward · Inquiry record</p><h1 className="mt-3 text-3xl">{record.subject}</h1><p className="mt-2">{record.status.replaceAll("_", " ")}</p></header>
    {query?.error && <p role="alert" className="border border-amber-400 p-4">{query.error === "conflict" ? "Another update was recorded. Review the current status and submit again." : "The update could not be recorded. Check the note and try again."}</p>}
    <section className="space-y-3 border border-slate-600 p-5"><h2 className="text-xl">{record.name}</h2><p className="break-words">{record.email} · {record.organization}</p><p className="text-sm text-slate-400">Received {record.createdAt.toISOString()} · Reference {record.id}</p><p className="whitespace-pre-wrap break-words leading-7">{record.message}</p></section>
    <section className="space-y-3"><h2 className="text-xl">Respond and record the outcome</h2><p className="text-sm text-slate-300">Reply from your French-Ward mailbox. Opening the mail link does not send a reply or change this record.</p>
      <a className="inline-block rounded border border-cyan-300 px-4 py-2 text-cyan-200" href={`mailto:${encodeURIComponent(record.email)}?subject=${encodeURIComponent("Re: " + record.subject)}`}>Open email reply</a>
      <p className="text-sm text-slate-400">French-Ward mailbox copy: {copy?.status || "No receipt recorded"}. <Link href="/admin/incoming/alerts" className="underline">Admin alert delivery</Link></p>
      <form method="post" action={`/api/admin/incoming/general/${record.id}`} className="space-y-4">
        <input type="hidden" name="revision" value={record.revision}/>
        <label className="block">Status<select name="status" defaultValue={record.status} className="ml-3 rounded border border-slate-500 bg-slate-900 p-2"><option value="OPEN">Open</option><option value="IN_REVIEW">In review</option><option value="CLOSED">Closed</option></select></label>
        <label className="block">Review note · required<textarea name="note" required maxLength={2000} rows={4} className="mt-2 block w-full rounded border border-slate-500 bg-slate-900 p-3" placeholder="Record your review, response, next step, or reason for closing."/></label>
        <button type="submit" className="rounded border border-amber-200 px-4 py-2 text-amber-100">Save review</button>
      </form>
    </section>
    <section className="space-y-3 border-t border-slate-600 pt-5"><h2 className="text-xl">Review history</h2><ul className="space-y-4">{record.events.map((event: { id: string; createdAt: Date; fromStatus: string | null; toStatus: string; note: string; actorUserId: string | null }) => <li key={event.id}><p className="text-xs text-slate-400">{event.createdAt.toISOString()} · {event.actorUserId || "Public submission"}</p><p className="mt-1 text-sm text-amber-200">{event.fromStatus ? event.fromStatus.replaceAll("_", " ") + " → " : ""}{event.toStatus.replaceAll("_", " ")}</p><p className="whitespace-pre-wrap break-words">{event.note}</p></li>)}</ul></section>
  </main>;
}
