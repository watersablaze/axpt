import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function ProfileIntroductionsPage() {
  const principal = await getPrincipal();
  if (!principal) redirect("/login?next=%2Fadmin%2Frepresentative-program%2Fprofile-introductions");
  if (!isAdmin(principal)) notFound();
  const records = await prisma.representativeProfileIntroduction.findMany({
    orderBy: { createdAt: "desc" }, take: 50,
    select: {
      id: true, recipientName: true, recipientEmail: true,
      recipientOrganization: true, purpose: true,
      resourceReference: true, resourceVersion: true, createdAt: true,
      recipientDeliveryStatus: true, adminDeliveryStatus: true,
      participant: { select: { displayName: true } },
      grant: { select: { expiresAt: true, revokedAt: true, firstAccessAt: true, lastAccessAt: true } },
    },
  });
  return <main className="min-h-screen bg-gray-950 px-6 py-8 text-gray-100">
    <Link href="/admin/representative-program" className="text-sm underline">Representative Program</Link>
    <h1 className="mt-5 text-2xl">Profile Introductions</h1>
    <p className="mt-2 text-sm text-gray-400">Latest 50 introductions. Email acceptance and recorded Profile access are tracked separately.</p>
    <Link href="/admin/institutional-access" className="mt-3 inline-block text-sm underline">Manage institutional access and revocation</Link>
    <div className="mt-6 space-y-4">{records.map((record: {
      id: string; recipientName: string; recipientEmail: string;
      recipientOrganization: string; purpose: string;
      resourceReference: string; resourceVersion: number; createdAt: Date;
      recipientDeliveryStatus: string; adminDeliveryStatus: string;
      participant: { displayName: string };
      grant: { expiresAt: Date; revokedAt: Date | null; firstAccessAt: Date | null; lastAccessAt: Date | null };
    }) => <article key={record.id} className="rounded border border-gray-700 p-4">
      <h2 className="font-medium">{record.participant.displayName} → {record.recipientName}</h2>
      <p className="text-sm text-gray-300">{record.recipientOrganization} · {record.recipientEmail}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm">{record.purpose}</p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div><dt className="text-gray-400">Publication</dt><dd>{record.resourceReference} · Edition {record.resourceVersion}</dd></div>
        <div><dt className="text-gray-400">Access</dt><dd>{record.grant.revokedAt ? "Revoked" : record.grant.expiresAt <= new Date() ? "Expired" : "Granted"} · expires {record.grant.expiresAt.toISOString()}</dd></div>
        <div><dt className="text-gray-400">Recipient email</dt><dd>{record.recipientDeliveryStatus}</dd></div>
        <div><dt className="text-gray-400">Admin email</dt><dd>{record.adminDeliveryStatus}</dd></div>
        <div><dt className="text-gray-400">First Profile access</dt><dd>{record.grant.firstAccessAt?.toISOString() || "Not recorded"}</dd></div>
        <div><dt className="text-gray-400">Last Profile access</dt><dd>{record.grant.lastAccessAt?.toISOString() || "Not recorded"}</dd></div>
      </dl><p className="mt-3 break-all font-mono text-xs text-gray-500">{record.id} · {record.createdAt.toISOString()}</p>
    </article>)}{!records.length && <p>No introductions recorded.</p>}</div>
  </main>;
}
