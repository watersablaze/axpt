"use client";

import { FormEvent, useMemo, useState } from "react";
import styles from "./transaction-intake.module.css";

type Props = {
  initialReferralCode?: string;
  initialRepresentativeName?: string;
  initialProgram?: string;
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; reference: string }
  | { status: "error"; message: string };

const roleOptions = [
  "Buyer",
  "Buyer Representative",
  "Buyer Mandate",
  "Intermediary",
  "Consultant",
  "Other",
];

const authorizationOptions = [
  "Principal",
  "Written authorization available",
  "Authorization pending",
  "Introduction only",
  "Not sure",
];

const programOptions = [
  "French-Ward Gold",
  "Bafoula Cooperative",
  "AXPT Strategic Intake",
  "General",
  "Other",
];

const transactionStructureOptions = [
  "Trial Purchase",
  "Recurring Supply",
  "Cash & Carry",
  "Refinery Settlement",
  "Escrow Settlement",
  "Hand-Carry Export",
  "Other",
  "Not sure",
];

const deliveryTermOptions = [
  "FOB",
  "CIF",
  "Hand-carry",
  "Ex-warehouse",
  "To be confirmed",
  "Other",
];

const settlementMethodOptions = [
  "MT103 Wire",
  "DLC",
  "SBLC",
  "Cash",
  "Escrow Settlement",
  "Refinery Settlement",
  "Other",
  "Not sure",
];

const readinessOptions = [
  "Corporate Information Sheet / CIS",
  "Proof of Funds / POF",
  "KYC available",
  "Mandate / authorization available",
  "Banking readiness",
  "DLC / SBLC readiness",
  "MT103 readiness",
  "Refinery readiness",
  "Logistics / import readiness",
  "LOI / ICPO / prior SPA available",
  "Other supporting documents",
];

const financialReadinessMarkers = [
  "Proof of Funds / POF",
  "Banking readiness",
  "DLC / SBLC readiness",
  "MT103 readiness",
];

function inputValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function multiValue(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

function buildFinancialReadiness(readinessItems: string[]) {
  return readinessItems
    .filter((item) => financialReadinessMarkers.includes(item))
    .join(", ");
}

export default function TransactionIntakeForm({
  initialReferralCode = "",
  initialRepresentativeName = "",
  initialProgram = "",
}: Props) {
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
  });

  const sourceUrl = useMemo(() => {
    if (typeof window === "undefined") return "";

    return window.location.href;
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const readinessItems = multiValue(formData, "readinessItems");
    const buyerName = inputValue(formData, "buyerName");

    const payload = {
      submitterName: inputValue(formData, "submitterName"),
      submitterEmail: inputValue(formData, "submitterEmail"),
      submitterPhone: inputValue(formData, "submitterPhone"),
      submitterCompany: inputValue(formData, "submitterCompany"),
      submitterCountry: inputValue(formData, "submitterCountry"),

      submitterRole: inputValue(formData, "submitterRole"),
      representedPartyType: "Buyer",
      representedPartyName: buyerName,
      authorizationStatus: inputValue(formData, "authorizationStatus"),

      program: inputValue(formData, "program"),
      transactionType: inputValue(formData, "transactionStructure"),
      commodity: inputValue(formData, "commodity"),
      quantity: inputValue(formData, "quantity"),
      trialQuantity: inputValue(formData, "trialQuantity"),
      monthlyQuantity: inputValue(formData, "monthlyQuantity"),
      origin: inputValue(formData, "origin"),
      destination: inputValue(formData, "destination"),
      deliveryTerms: inputValue(formData, "deliveryTerms"),
      settlementMethod: inputValue(formData, "settlementMethod"),
      expectedTimeline: inputValue(formData, "expectedTimeline"),

      buyerName,
      sellerName: "",
      refineryPreference: "",
      financialReadiness: buildFinancialReadiness(readinessItems),
      documentsAvailable: readinessItems.join(", "),
      supportingNotes: inputValue(formData, "supportingNotes"),

      referralCode: inputValue(formData, "referralCode"),
      referredByName: inputValue(formData, "referredByName"),
      referredByCompany: inputValue(formData, "referredByCompany"),
      referredByEmail: inputValue(formData, "referredByEmail"),
      referredByPhone: "",
      referredByRole: inputValue(formData, "referredByRole"),
      referralConfirmed: false,
      compensationExpectation: "",

      declarationAccuracy: formData.get("declarationAccuracy") === "on",
      declarationNoObligation: formData.get("declarationNoObligation") === "on",
      declarationNoCommission: formData.get("declarationNoCommission") === "on",

      sourceUrl,
    };

    if (
      !payload.submitterName ||
      !payload.submitterEmail ||
      !payload.submitterRole
    ) {
      setSubmitState({
        status: "error",
        message: "Please provide your name, email, and role.",
      });
      return;
    }

    if (!payload.buyerName && payload.submitterRole !== "Buyer") {
      setSubmitState({
        status: "error",
        message: "Please identify the buyer company or buyer-side party.",
      });
      return;
    }

    if (
      !payload.declarationAccuracy ||
      !payload.declarationNoObligation ||
      !payload.declarationNoCommission
    ) {
      setSubmitState({
        status: "error",
        message:
          "Please confirm all required submission notices before submitting.",
      });
      return;
    }

    setSubmitState({ status: "submitting" });

    try {
      const response = await fetch("/api/transaction-intake", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        setSubmitState({
          status: "error",
          message:
            data?.error ||
            `Unable to submit transaction intake. Server returned ${response.status}.`,
        });
        return;
      }

      const reference = data?.intake?.reference;

      if (!reference) {
        setSubmitState({
          status: "error",
          message:
            "The intake was submitted but no reference was returned. Please check the admin intake queue.",
        });
        return;
      }

      setSubmitState({
        status: "success",
        reference,
      });
    } catch (error) {
      console.error("[transaction-intake:submit]", error);

      setSubmitState({
        status: "error",
        message:
          "Unable to submit transaction intake. Please check the browser console or server logs.",
      });
    }
  }

  if (submitState.status === "success") {
    return (
      <section className={styles.successCard}>
        <p className={styles.kicker}>Submission Received</p>
        <h2>Your transaction intake has been submitted.</h2>
        <p>Please retain this reference for future communication:</p>
        <div className={styles.reference}>{submitState.reference}</div>
        <p className={styles.muted}>
          Status: Submitted for Review. This submission has been received for
          internal review only. It does not constitute acceptance, approval,
          allocation, contract formation, mandate recognition, commission
          recognition, or issuance permission.
        </p>
      </section>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <section className={styles.section}>
        <h2>Representative / Referral</h2>
        <p className={styles.helper}>
          Provide the issuing representative or referral details associated with
          this submission, if applicable.
        </p>

        <div className={styles.grid}>
          <label>
            Referral code
            <input name="referralCode" defaultValue={initialReferralCode} />
          </label>

          <label>
            Issuing representative
            <input
              name="referredByName"
              defaultValue={initialRepresentativeName}
            />
          </label>

          <label>
            Representative email
            <input name="referredByEmail" type="email" />
          </label>

          <label>
            Representative company
            <input name="referredByCompany" />
          </label>

          <label>
            Representative role
            <input
              name="referredByRole"
              placeholder="Introducer, mandate, consultant..."
            />
          </label>

          <label>
            Program
            <select name="program" defaultValue={initialProgram}>
              <option value="">Select program</option>
              {programOptions.map((program) => (
                <option key={program} value={program}>
                  {program}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Buyer / Submitter</h2>
        <p className={styles.helper}>
          Identify the buyer-side party responsible for this inquiry.
        </p>

        <div className={styles.grid}>
          <label>
            Your full name *
            <input name="submitterName" required />
          </label>

          <label>
            Email *
            <input name="submitterEmail" type="email" required />
          </label>

          <label>
            Phone / WhatsApp
            <input name="submitterPhone" />
          </label>

          <label>
            Your role *
            <select name="submitterRole" required defaultValue="">
              <option value="" disabled>
                Select role
              </option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label>
            Buyer company / party
            <input name="buyerName" />
          </label>

          <label>
            Submitter company
            <input name="submitterCompany" />
          </label>

          <label>
            Country / jurisdiction
            <input name="submitterCountry" />
          </label>

          <label>
            Authorization status
            <select name="authorizationStatus" defaultValue="">
              <option value="">Select status</option>
              {authorizationOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Transaction Structure</h2>
        <p className={styles.helper}>
          Structure describes the commercial shape of the proposed deal.
          Delivery terms describe how the commodity is handed over. Settlement
          method describes how payment is expected to clear.
        </p>

        <div className={styles.grid}>
          <label>
            Transaction structure
            <select name="transactionStructure" defaultValue="">
              <option value="">Select structure</option>
              {transactionStructureOptions.map((structure) => (
                <option key={structure} value={structure}>
                  {structure}
                </option>
              ))}
            </select>
          </label>

          <label>
            Delivery terms
            <select name="deliveryTerms" defaultValue="">
              <option value="">Select delivery terms</option>
              {deliveryTermOptions.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </label>

          <label>
            Settlement method
            <select name="settlementMethod" defaultValue="">
              <option value="">Select method</option>
              {settlementMethodOptions.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>

          <label>
            Expected timeline
            <input
              name="expectedTimeline"
              placeholder="Example: immediate, 7 days, 30 days..."
            />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Commodity Request</h2>
        <p className={styles.helper}>
          Total quantity is the full requested amount for the proposed
          transaction or contract. Trial quantity is the first test shipment or
          initial tranche. Monthly quantity is the recurring amount requested
          after the trial or first transaction.
        </p>

        <div className={styles.grid}>
          <label>
            Commodity
            <input
              name="commodity"
              placeholder="Gold, agriculture, energy..."
            />
          </label>

          <label>
            Total quantity
            <input name="quantity" placeholder="Example: 500 KG total" />
          </label>

          <label>
            Trial quantity
            <input name="trialQuantity" placeholder="Example: 5 KG trial" />
          </label>

          <label>
            Monthly quantity
            <input
              name="monthlyQuantity"
              placeholder="Example: 100 KG monthly"
            />
          </label>

          <label>
            Origin
            <input name="origin" />
          </label>

          <label>
            Destination
            <input name="destination" />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Readiness Status</h2>
        <p className={styles.helper}>
          Indicate which supporting materials are currently available.
          Additional documentation may be requested after preliminary review.
        </p>

        <div className={styles.checkboxGrid}>
          {readinessOptions.map((item) => (
            <label key={item} className={styles.checkbox}>
              <input name="readinessItems" type="checkbox" value={item} />
              {item}
            </label>
          ))}
        </div>

        <div className={styles.grid}>
          <label className={styles.wide}>
            Additional notes
            <textarea
              name="supportingNotes"
              rows={4}
              placeholder="Include any essential context, constraints, readiness details, or next-step information."
            />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Submission Notice</h2>

        <label className={styles.checkbox}>
          <input name="declarationAccuracy" type="checkbox" required />I confirm
          the information provided is accurate to the best of my knowledge and
          that I am authorized to submit it or have clearly identified myself as
          an introducer only.
        </label>

        <label className={styles.checkbox}>
          <input name="declarationNoObligation" type="checkbox" required />I
          understand this submission is a review intake only and does not create
          acceptance, approval, allocation, contract formation, mandate
          recognition, agency authorization, or obligation by AXPT, French-Ward
          International, or any associated party.
        </label>

        <label className={styles.checkbox}>
          <input name="declarationNoCommission" type="checkbox" required />I
          understand that referral or representative information may be
          reviewed, but this intake does not create, confirm, or guarantee
          commission rights, compensation rights, or mandate status.
        </label>
      </section>

      {submitState.status === "error" && (
        <div className={styles.error}>{submitState.message}</div>
      )}

      <button
        className={styles.submit}
        type="submit"
        disabled={submitState.status === "submitting"}
      >
        {submitState.status === "submitting"
          ? "Submitting..."
          : "Submit for Review"}
      </button>
    </form>
  );
}
