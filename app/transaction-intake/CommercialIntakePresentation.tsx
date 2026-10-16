import Image from "next/image";
import Link from "next/link";
import TransactionIntakeForm from "./TransactionIntakeForm";
import CommercialIntakeAccessRequest from "./CommercialIntakeAccessRequest";
import styles from "./transaction-intake.module.css";

export default function CommercialIntakePresentation({
  allowed, readOnly = false, backHref = "/representative",
  referralCode = "", representativeName = "", program = "",
  initialName = "", initialEmail = "",
}: {
  allowed: boolean; readOnly?: boolean; backHref?: string;
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
                Secure Commodity Management
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
            Preliminary Commercial Alignment
            Instrument
          </p>

          <h1>
            Letter of Intent
            <span>&amp; Transaction Intake</span>
          </h1>

          <p className={styles.heroLead}>
            A controlled entry point for proposed
            commodity transactions progressing through
            French-Ward commercial review.
          </p>
        </div>
      </section>

      {readOnly ? (
        <aside aria-label="LOI preview notice" className="mx-auto max-w-5xl px-6 py-4 text-sm text-[#eee7da]">
          <Link href={backHref} className="text-[#e8cb91] underline underline-offset-4">← Back to CUP</Link>
          <p className="mt-3">Read-only LOI preview · Fields and submission are disabled.</p>
          <p className="mt-1">Include LOI access in the buyer invitation to let that recipient open and submit the form after sign-in.</p>
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
