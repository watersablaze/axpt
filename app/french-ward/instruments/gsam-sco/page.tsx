import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import { resolveInstitutionalAccessWithClient } from "@/domains/institutional-access/resolveInstitutionalAccessWithClient";
import { genericProgramScoVariants } from "@/domains/institutions/french-ward/genericProgramScoVariants";
import styles from "./room.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Growthcorp | Your Commercial Documents", robots: { index: false, follow: false } };

export default async function GrowthcorpDocumentRoom() {
  // This room must not expose live source as a released edition.
  if (process.env.GSAM_SCO_RECIPIENT_RELEASE !== "enabled" ||
      process.env.GSAM_SCO_FROZEN_EDITION_V2_READY !== "enabled") notFound();
  const principal = await getPrincipal();
  if (!principal?.userId || !principal?.email) notFound();
  const variants = [
    { slug: "100-mt", record: genericProgramScoVariants["gsam-100-mt"] },
    { slug: "1000-mt", record: genericProgramScoVariants["gsam-1000-mt"] },
  ];
  const permitted = await Promise.all(variants.map(async item => ({
    ...item,
    access: await resolveInstitutionalAccessWithClient({
      client: prisma, identity: { userId: principal.userId, email: principal.email },
      scope: "SUPPORTING_DOCUMENT_VIEW", action: "VIEW",
      resourceReference: item.record.reference, resourceVersion: 1,
    }),
  })));
  if (!permitted.some(item => item.access.allowed)) notFound();
  return <main className={styles.shell}>
    <header className={styles.header}>
      <span className={styles.eyebrow}>GROWTHCORP SOLUTIONS ASSET MANAGEMENT LIMITED</span>
      <h1>Your Commercial Documents</h1>
      <p>Two Soft Corporate Offers, available for online review and PDF download.</p>
    </header>
    <div className={styles.documents}>
      {permitted.map(item => <section className={styles.document} key={item.slug}>
        <div><span className={styles.type}>SOFT CORPORATE OFFER</span><h2>{item.record.quantityMt.toLocaleString("en-US")} MT</h2></div>
        {item.access.allowed ? <nav className={styles.actions} aria-label={`${item.record.quantityMt} MT document actions`}>
          <a className={styles.primary} href={`/api/french-ward/gsam-sco/${item.slug}/pdf`}>Download PDF</a>
          <Link className={styles.secondary} href={`/french-ward/instruments/gsam-sco/${item.slug}`}>View Online</Link>
        </nav> : <p className={styles.unavailable}>Access not yet approved for this document.</p>}
      </section>)}
    </div>
    <footer className={styles.footer}>For assistance, reply to the email that brought you here. Access is personal to your approved account.</footer>
  </main>;
}
