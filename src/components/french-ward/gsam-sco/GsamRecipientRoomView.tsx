import Link from "next/link";
import styles from "@/app/french-ward/instruments/gsam-sco/room.module.css";

export type GsamRoomDocument = {
  slug: string;
  quantityMt: number;
  allowed: boolean;
  htmlUrl: string;
  pdfUrl: string;
};

export function GsamRecipientRoomView({
  documents,
}: {
  documents: GsamRoomDocument[];
}) {
  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>
          GROWTHCORP SOLUTIONS ASSET MANAGEMENT LIMITED
        </span>
        <h1>Your Commercial Documents</h1>
        <p>
          Two Soft Corporate Offers, available for online review
          and PDF download.
        </p>
      </header>

      <div className={styles.documents}>
        {documents.map((item) => (
          <section className={styles.document} key={item.slug}>
            <div>
              <span className={styles.type}>
                SOFT CORPORATE OFFER
              </span>
              <h2>
                {item.quantityMt.toLocaleString("en-US")} MT
              </h2>
            </div>

            {item.allowed ? (
              <nav
                className={styles.actions}
                aria-label={`${item.quantityMt} MT document actions`}
              >
                <a className={styles.primary} href={item.pdfUrl}>
                  Download PDF
                </a>
                <Link className={styles.secondary} href={item.htmlUrl}>
                  View Online
                </Link>
              </nav>
            ) : (
              <p className={styles.unavailable}>
                Access not yet approved for this document.
              </p>
            )}
          </section>
        ))}
      </div>

      <footer className={styles.footer}>
        For assistance, reply to the email that brought you here.
        Access is personal to your approved account.
      </footer>
    </main>
  );
}
