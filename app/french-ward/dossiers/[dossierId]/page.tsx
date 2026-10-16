import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import { loadRecipientBuyerDossierWithClient } from "@/domains/instruments/representative-program/commercial-utility-pack/application/loadRecipientBuyerDossierWithClient";
import styles from "../dossier.module.css";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata: Metadata = { title: "French-Ward — Your Documents", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function BuyerDossierPage({ params }: { params: Promise<{ dossierId: string }> }) {
  const { dossierId } = await params;
  const principal = await getPrincipal();
  if (!principal) redirect("/login?next=" + encodeURIComponent("/french-ward/dossiers/" + encodeURIComponent(dossierId)));
  const dossier = await loadRecipientBuyerDossierWithClient({ client: prisma, dossierId, userId: principal.userId, email: principal.email });
  if (!dossier) notFound();
  return <main className={styles.reception}>
    <header className={styles.header}><Link href="/french-ward">FRENCH-WARD, INC.</Link><span>Institutional Documents</span></header>
    <section className={styles.welcome}>
      <p className={styles.eyebrow}>Prepared for {dossier.recipientName}</p>
      <h1>Your French-Ward documents</h1>
      <p>Review the materials selected for your introduction. Return through your invitation to continue reviewing them.</p>
      <p className={styles.meta}>Access expires {dossier.expiresAt.toISOString().slice(0, 16).replace("T", " ")} UTC</p>
    </section>
    <div className={styles.documents}>{dossier.items.map(item => <article key={item.id} className={styles.document}>
      <p className={styles.meta}>{item.reference} · Edition {item.version}</p>
      <h2>{item.label}</h2>
      {item.available ? <Link className={styles.open} href={`/french-ward/dossiers/${encodeURIComponent(dossier.id)}/publications/${encodeURIComponent(item.id)}`} prefetch={false}>Open full document →</Link>
        : <p>This publication is currently unavailable. Contact French-Ward for assistance.</p>}
    </article>)}</div>
    <section className={styles.document}
      aria-label="Letter of Intent and Transaction Intake"
      style={{ marginTop: 24 }}>
      <p className={styles.eyebrow}>Commercial Intake</p>
      <h2>Letter of Intent &amp; Transaction Intake</h2>
      <p className={styles.meta}>
        Ready to outline a proposed transaction? Open French-Ward’s
        controlled commercial intake. Access to these publications does
        not automatically approve access to the intake form.
      </p>
      <Link className={styles.open}
        href="/french-ward/transaction-intake" prefetch={false}>
        Open Letter of Intent →
      </Link>
    </section>
    <footer className={styles.footer}>For correspondence: <a href="mailto:french-ward@axpt.io">french-ward@axpt.io</a></footer>
  </main>;
}
