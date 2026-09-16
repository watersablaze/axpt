import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import TransactionIntakeForm from "./TransactionIntakeForm";
import styles from "./transaction-intake.module.css";

export const metadata: Metadata = {
  title:
    "Letter of Intent & Transaction Intake — French-Ward",
  description:
    "French-Ward preliminary commercial alignment and controlled transaction intake instrument.",
};

type Props = {
  searchParams?: Promise<{
    ref?: string;
    rep?: string;
    program?: string;
  }>;
};

export default async function TransactionIntakePage({
  searchParams,
}: Props) {
  const params = await searchParams;

  const referralCode = params?.ref || "";
  const representativeName = params?.rep || "";
  const program = params?.program || "";

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
          <a href="#delivery">04 Delivery</a>
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
        initialReferralCode={referralCode}
        initialRepresentativeName={
          representativeName
        }
        initialProgram={program}
      />
    </main>
  );
}
