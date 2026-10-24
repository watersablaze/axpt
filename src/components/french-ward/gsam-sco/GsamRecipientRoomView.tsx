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
  preview = false,
}: {
  documents: GsamRoomDocument[];
  preview?: boolean;
}) {
  return (
    <main className={styles.shell}>
      {preview && (
        <div role="status" style={{padding:"12px 18px",marginBottom:18,border:"1px solid #9e865a",background:"#f4ecd9",color:"#463b2a",fontSize:13}}>
          ADMINISTRATOR PREVIEW · James Crawford · No recipient session, grants or document availability are implied.
        </div>
      )}
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

            {item.allowed ? preview ? (
              <nav className={styles.actions} aria-label={`${item.quantityMt} MT preview actions`}>
                <span className={styles.primary} aria-disabled="true">Download PDF · Preview</span>
                <span className={styles.secondary} aria-disabled="true">View Online · Preview</span>
              </nav>
            ) : (
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
        {preview ? "Administrator presentation preview only. No access has been granted and no invitation has been sent." : "For assistance, reply to the email that brought you here. Access is personal to your approved account."}
      </footer>
    </main>
  );
}
