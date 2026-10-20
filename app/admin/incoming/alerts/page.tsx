import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
export const dynamic = "force-dynamic";
export default async function AlertDeliveryPage() {
  const principal = await getPrincipal();
  if (!principal) redirect("/login?next=/admin/incoming/alerts");
  if (!isAdmin(principal)) notFound();
  const rows = await prisma.emailLog.findMany({ where: { type: { startsWith: "ADMIN_INCOMING_V1:" } }, orderBy: { id: "desc" }, take: 100,
    select: { id: true, subject: true, status: true, messageId: true, createdAt: true } });
  return <main style={{ padding: 24 }}><Link href="/admin/incoming">← Incoming work</Link><h1>Admin alert delivery</h1>
    <p>Mode: {process.env.ADMIN_INCOMING_ALERT_EMAIL_MODE === "send" ? "Send" : "Log only"}.</p>
    <p>Destination: connect@axpt.io. SENT means accepted by the email provider. It does not confirm inbox delivery.</p>
    <p>Uncertain or interrupted sends are held to avoid duplicates. Check the provider before taking further action. This view shows the latest 100 new access-request and field-message alerts.</p>
    {!rows.length ? <p>No alerts recorded yet.</p> : <ul>{rows.map(row => <li key={row.id} style={{ padding: "16px 0", borderBottom: "1px solid #8b9aab55" }}>
      <strong>{row.subject}</strong><p>{row.createdAt.toISOString()} · {row.status}{row.messageId ? " · Provider reference: " + row.messageId : ""}</p>
      {["QUEUED", "FAILED", "LOGGED_ONLY"].includes(row.status || "") && <form method="post" action="/api/admin/incoming/alerts/retry"><input type="hidden" name="id" value={row.id}/><button type="submit">Process alert</button></form>}
    </li>)}</ul>}</main>;
}
