import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import styles from "./preview.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "GSAM SCO · Administration Preview",
  robots: { index: false, follow: false },
};

const editions = [
  {
    variant: "100-mt",
    quantity: "100 MT",
    reference: "GSAM-SCO-PROGRAM-100MT-2026-001",
  },
  {
    variant: "1000-mt",
    quantity: "1,000 MT",
    reference: "GSAM-SCO-PROGRAM-1000MT-2026-001",
  },
] as const;

export default async function GsamAdministrationPreview() {
  const principal = await getPrincipal();

  if (!principal) {
    redirect(
      "/login?next=%2Fadmin%2Finstruments%2Fgsam-sco%2Fpreview"
    );
  }

  if (!isAdmin(principal)) notFound();

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>
          FRENCH-WARD / ADMINISTRATION / DOCUMENTARY REVIEW
        </p>

        <h1>GSAM — Soft Corporate Offers</h1>

        <p className={styles.intro}>
          Frozen institutional editions prepared for James Crawford
          of Growthcorp Solutions Asset Management Limited.
        </p>

        <div className={styles.status}>
          <span>ADMINISTRATOR PREVIEW</span>
          <span>EDITION 3L2-S5</span>
          <span>NOT A RECIPIENT SESSION</span>
        </div>
      </header>

      <section className={styles.grid} aria-label="GSAM SCO editions">
        {editions.map((edition, index) => (
          <article className={styles.card} key={edition.variant}>
            <p className={styles.eyebrow}>
              DOCUMENT {String(index + 1).padStart(2, "0")}
            </p>

            <h2>{edition.quantity}</h2>
            <p className={styles.type}>Soft Corporate Offer</p>
            <p className={styles.reference}>{edition.reference}</p>

            <div className={styles.actions}>
              <a
                href={`/admin/instruments/gsam-sco/preview/${edition.variant}/html`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.primary}
              >
                View frozen HTML
              </a>

              <a
                href={`/admin/instruments/gsam-sco/preview/${edition.variant}/pdf`}
                className={styles.secondary}
              >
                Download verified PDF
              </a>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.details}>
        <h2>Release inspection</h2>
        <p>
          Each document action reads the registered frozen artifact
          from object storage and verifies its SHA-256 digest before
          returning its bytes.
        </p>
        <p>
          This preview is for authorized AXPT administration.
          It does not approve issuance, impersonate the recipient,
          or activate public document access.
        </p>
      </section>

      <footer className={styles.footer}>
        <Link href="/admin/institutional-access">
          Institutional Access Administration
        </Link>
        <span>French-Ward Administration</span>
      </footer>
    </main>
  );
}
