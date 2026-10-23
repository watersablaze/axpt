import Image from "next/image";
import Link from "next/link";
import TransactionIntakeForm from "./TransactionIntakeForm";
import CommercialIntakeAccessRequest from "./CommercialIntakeAccessRequest";
import styles from "./transaction-intake.module.css";

export default function CommercialIntakePresentation({
  allowed, readOnly = false, interactivePreview = false, showPreviewNotice = true, backHref = "/representative",
  referralCode = "", representativeName = "", program = "",
  initialName = "", initialEmail = "",
}: {
  allowed: boolean; readOnly?: boolean; interactivePreview?: boolean; showPreviewNotice?: boolean; backHref?: string;
  referralCode?: string; representativeName?: string; program?: string;
  initialName?: string; initialEmail?: string;
}) {
  return (
    <main className={styles.page}>
      <header className={styles.instrumentMasthead}>
        <div className={styles.mastheadInner}>
          <Link
            href="/french-ward"
            className={styles.returnLink}
          >
            <span aria-hidden="true">←</span>
            <span>French-Ward</span>
          </Link>
          <div className={styles.issuer}>
            <Image
              className={styles.issuerSeal}
              src="/FW/french-ward_V3.2.png"
              alt=""
              width={44}
              height={44}
              priority
            />

            <div>
              <p>French-Ward, Inc.</p>
              <span>
                Commercial Relations & Transaction Preparation
              </span>
            </div>
          </div>

          <div className={styles.documentMeta}>
            <span>
              Pre-Contractual / Controlled Intake
            </span>
            <strong>V4 / 2026</strong>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.kicker}>
            French-Ward / Commercial Intake
          </p>

          <h1>
            <span className={styles.desktopTitle}>Letter of Intent &amp; Transaction Intake</span>
            <span className={styles.mobileTitle}><strong>LOI</strong><span>Transaction Intake</span></span>
          </h1>

          <p className={styles.heroLead}>
            Complete the particulars below to present a proposed commodity transaction for French-Ward’s review.
          </p>
        </div>
      </section>

      {readOnly && showPreviewNotice ? (
        <aside aria-label="LOI preview notice" className={styles.previewNotice}>
          <Link href={backHref} className={styles.previewReturn}>← Return to review</Link>
          <p >Read-only LOI preview · Fields and submission are disabled.</p>
          <p >Include LOI access in the buyer invitation to let that recipient open and submit the form after sign-in.</p>
        </aside>
      ) : null}
      {allowed ? (
        <>
          <nav
            className={styles.instrumentNav}
            aria-label="Transaction intake sections"
          >
            <div>
              <a href="#status">01 Status</a>
              <a href="#counterparty">
                02 Counterparty
              </a>
              <a href="#transaction">
                03 Transaction
              </a>
              <a href="#delivery">
                04 Delivery
              </a>
              <a href="#settlement">
                05 Settlement
              </a>
              <a href="#readiness">
                06 Readiness
              </a>
              <a href="#submission">
                07 Submission
              </a>
            </div>
          </nav>

          <TransactionIntakeForm
            readOnly={readOnly}
            interactivePreview={interactivePreview}
            initialReferralCode={
              referralCode
            }
            initialRepresentativeName={
              representativeName
            }
            initialProgram={
              program
            }
          />
        </>
      ) : (
        <CommercialIntakeAccessRequest
          initialName={
            initialName
          }
          initialEmail={
            initialEmail
          }
        />
      )}
    </main>
  );
}
