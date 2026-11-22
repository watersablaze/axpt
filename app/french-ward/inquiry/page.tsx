import type { Metadata } from "next";
import Link from "next/link";
import InquiryForm from "./InquiryForm";
import styles from "./inquiry.module.css";

export const metadata: Metadata = {
  title: "French-Ward — Inquiry",
  description: "Contact French-Ward about commercial relationships and institutional cooperation.",
};

export default function FrenchWardInquiryPage() {
  return (
    <main className={styles.page}>
      <div className={styles.reception}>
        <div className={styles.eyebrow}>FW / CORRESPONDENCE <span>03 / INQUIRY</span></div>
        <div className={styles.orientation}>
          <h1>INQUIRY <span>&amp; CORRESPONDENCE</span></h1>
          <p>Send a message to French-Ward regarding a business relationship, commercial opportunity, or general inquiry.</p>
        </div>
        <InquiryForm />
        <p className={styles.boundary}>Submitting an inquiry does not establish an appointment, transaction, representation, or authority to act for French-Ward.</p>
        <Link href="/french-ward" className={styles.return}>← RETURN TO FRENCH-WARD</Link>
      </div>
    </main>
  );
}
