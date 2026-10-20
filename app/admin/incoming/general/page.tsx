import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
export const dynamic = "force-dynamic";
export default async function GeneralInquiryArchive({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  const principal = await getPrincipal();
  if (!principal) redirect("/login?next=/admin/incoming");
  if (!isAdmin(principal)) notFound();
  const query = await searchParams; const value = Number(query?.page || 1);
  const page = Number.isSafeInteger(value) && value > 0 && value <= 10000 ? value : 1;
  const rows = await prisma.frenchWardInquiry.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 25, take: 26, select: { id: true, name: true, subject: true, status: true, createdAt: true } });
  return <main className="mx-auto max-w-4xl space-y-5 px-5 py-7 text-slate-100"><Link href="/admin/incoming?lane=general" className="text-cyan-200 underline">← Incoming general inquiries</Link><h1 className="text-3xl">All general inquiries</h1><p>Includes closed records. Earlier email-only inquiries are not imported.</p>
    {!rows.length ? <p>No records on this page.</p> : <ul className="space-y-4">{rows.slice(0, 25).map((row: { id: string; name: string; subject: string; status: string; createdAt: Date }) => <li key={row.id} className="border border-slate-600 p-4"><Link href={`/admin/incoming/general/${row.id}`} className="text-cyan-200 underline">{row.subject} · {row.name}</Link><p className="mt-2 text-sm">{row.status.replaceAll("_", " ")} · {row.createdAt.toISOString()}</p></li>)}</ul>}
    <nav aria-label="Inquiry archive pages" className="flex gap-5">{page > 1 && <Link href={`?page=${page - 1}`}>← Previous</Link>}<span>Page {page}</span>{rows.length > 25 && <Link href={`?page=${page + 1}`}>Next →</Link>}</nav></main>;
}
