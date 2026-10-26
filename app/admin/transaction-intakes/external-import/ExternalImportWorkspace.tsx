"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const FIELDS = [
  { name: "operationalReference", label: "Operational reference", group: "identity", placeholder: "Institutional transaction reference" },
  { name: "commodity", label: "Commodity", group: "identity", placeholder: "Commodity and specification" },
  { name: "trialQuantity", label: "Trial quantity", group: "terms", placeholder: "Quantity and unit" },
  { name: "monthlyQuantity", label: "Monthly quantity", group: "terms", placeholder: "Quantity and unit" },
  { name: "destination", label: "Destination", group: "terms", placeholder: "Agreed or proposed destination" },
  { name: "deliveryTerms", label: "Delivery terms", group: "terms", placeholder: "Incoterms or stated delivery basis" },
  { name: "settlementMethod", label: "Settlement method", group: "terms", placeholder: "Stated settlement arrangement" },
  { name: "submitterName", label: "Source contact", group: "source", placeholder: "Full name" },
  { name: "submitterEmail", label: "Source email", group: "source", placeholder: "contact@example.com" },
  { name: "submitterRole", label: "Source capacity", group: "source", placeholder: "Declared relationship or role" },
  { name: "originatingCandidateName", label: "Originating candidate", group: "parties", placeholder: "Originating institution or party" },
  { name: "buyerName", label: "Buyer", group: "parties", placeholder: "Buyer legal or declared name" },
] as const;

type Values = Record<(typeof FIELDS)[number]["name"], string>;
type Phase = "entry" | "review" | "complete";

type Receipt = {
  ok?: boolean;
  error?: string;
  intake?: {
    id?: string;
    reference?: string;
    alreadyRegistered?: boolean;
  };
  evidence?: {
    reference?: string;
    sha256?: string;
    byteLength?: number;
    disposition?: string;
  };
  buyerAuthorityVerified?: boolean;
  representativeAuthorityGranted?: boolean;
  opportunityPromoted?: boolean;
};

const initialValues = Object.fromEntries(
  FIELDS.map((field) => [field.name, ""]),
) as Values;

const messageByError: Record<string, string> = {
  UNAUTHORIZED: "Your administrative session has expired.",
  FORBIDDEN: "Your account is not authorized to register external intakes.",
  EXPLICIT_CONFIRMATION_REQUIRED: "The explicit registration confirmation is required.",
  REGISTRATION_CONFLICT: "This reference conflicts with an existing record or evidence.",
  EVIDENCE_CUSTODY_UNAVAILABLE: "Private evidence custody is unavailable. No successful registration is confirmed.",
  PRIVATE_STORAGE_UNAVAILABLE: "Private evidence storage is not configured.",
  INVALID_EXTERNAL_INTAKE: "Review the submitted particulars and supporting PDF.",
  REQUEST_TOO_LARGE: "The evidence request exceeds the permitted size.",
  REGISTRATION_FAILED: "The registration could not be completed. Verify its status before retrying.",
};

export default function ExternalImportWorkspace() {
  const [values, setValues] = useState<Values>(initialValues);
  const [introductionChannelName, setIntroductionChannelName] =
    useState("");
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("entry");
  // FW-TXN-1B.6M: independently controlled documentary rail.
  const [railOpen, setRailOpen] = useState(true);
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!FIELDS.every((field) => values[field.name].trim())) {
      setError("Complete all declared transaction fields.");
      return;
    }

    if (
      !file ||
      file.type !== "application/pdf" ||
      file.size < 5 ||
      file.size > 25_000_000
    ) {
      setError("Select a PDF evidence document between 5 bytes and 25 MB.");
      return;
    }

    setConfirmation("");
    setPhase("review");
  }

  async function register() {
    if (pending || confirmation !== "REGISTER EXTERNAL INTAKE" || !file) {
      return;
    }

    setPending(true);
    setError("");

    try {
      const form = new FormData();

      for (const field of FIELDS) {
        form.append(field.name, values[field.name].trim());
      }

      form.append("evidencePdf", file);
      form.append("confirmation", confirmation);
      if (introductionChannelName.trim()) {
        form.append(
          "introductionChannelName",
          introductionChannelName.trim(),
        );
      }

      const response = await fetch(
        "/api/admin/transaction-intakes/external-import",
        {
          method: "POST",
          body: form,
          credentials: "same-origin",
          cache: "no-store",
        },
      );

      const body: Receipt = await response.json();

      if (!response.ok || !body.ok) {
        setError(
          messageByError[body.error || ""] ||
          "Registration was not confirmed. Check the transaction registry before retrying.",
        );
        return;
      }

      setReceipt(body);
      setPhase("complete");
    } catch {
      setError(
        "The registration result could not be confirmed. Check the registry before retrying.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className={styles.workspace}>
      <header className={styles.header}>
        <div className={styles.eyebrow}>French-Ward / Transactions</div>
        <div className={styles.headerRow}>
          <div>
            <h1>External Transaction Registration</h1>
            <p>
              Register external commercial records with verified document
              integrity and preserved authority boundaries.
            </p>
          </div>
          <Link href="/admin/transaction-intakes" className={styles.back}>
            Intake registry ↗
          </Link>
        </div>
      </header>

      {/* FW-TXN-1B.6L · Surface-led administrative navigation */}
      <nav className={styles.adminSubnav} aria-label="Transaction administration">
        <div className={styles.adminSubnavLinks}>
          <Link href="/admin/transaction-intakes">Intake Registry</Link>
          <span className={styles.adminSubnavCurrent} aria-current="page">
            External Registration
          </span>
          <Link href="/admin/transaction-intakes/representatives">
            Representatives
          </Link>
          <Link href="/admin/control-center/transactions">
            Transaction Registry
          </Link>
        </div>
        <div className={styles.subnavTools}>
          <span className={styles.adminSubnavStatus}>
            {phase === "entry"
              ? "01 / Prepare"
              : phase === "review"
                ? "02 / Review"
                : "03 / Receipt"}
          </span>
          <button
            type="button"
            className={styles.railToggle}
            aria-expanded={railOpen}
            aria-controls="fw-transaction-documentary-rail"
            onClick={() => setRailOpen((current) => !current)}
          >
            {railOpen ? "Hide controls −" : "Show controls +"}
          </button>
        </div>
      </nav>

      <div className={`${styles.layout} ${!railOpen ? styles.layoutRailClosed : ""}`}>
        <div className={styles.primary}>
          {phase === "entry" ? (
            <form onSubmit={review} className={styles.form}>
              <Section number="01" title="Transaction identity" description="Identify the commercial record without implying acceptance of its terms.">
                <Fields group="identity" values={values} onChange={setValues} />
              </Section>
              <Section number="02" title="Parties and source" description="Record the origin of the instruction and the parties it identifies.">
                <Fields group="parties" values={values} onChange={setValues} />
                <Fields group="source" values={values} onChange={setValues} />
                <label className={styles.field}>
                  <span>Introduction channel · optional</span>
                  <input
                    type="text"
                    maxLength={2000}
                    value={introductionChannelName}
                    placeholder="Intermediary introducing the buyer"
                    onChange={(event) =>
                      setIntroductionChannelName(event.target.value)
                    }
                  />
                  <small>
                    Record an identified intermediary without implying
                    representative, signing or compensation authority.
                  </small>
                </label>
              </Section>
              <Section number="03" title="Commercial particulars" description="Transcribe the stated terms faithfully; do not imply independent verification.">
                <Fields group="terms" values={values} onChange={setValues} />
              </Section>
              <Section number="04" title="Source evidence" description="Preserve the originating document exactly as received.">
                <div className={styles.evidenceIntroduction}>
                  <div className={styles.documentSymbol} aria-hidden="true">PDF</div>
                  <div>
                    <strong>Primary source document</strong>
                    <p>
                      The file is retained in private object custody. Its SHA-256
                      fingerprint becomes part of the registration receipt.
                    </p>
                  </div>
                </div>
                <label className={styles.fileInput}>
                  <span>Source document · PDF required</span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    required
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                  />
                  <small>
                    {file
                      ? `${file.name} · ${(file.size / 1024).toFixed(1)} KB · Selected for review`
                      : "PDF only · Maximum 25 MB · Not transmitted until final confirmation"}
                  </small>
                </label>
              </Section>
              {error && <p role="alert" className={styles.error}>{error}</p>}
              <div className={styles.actions}>
                <div className={styles.actionContext}>
                  <strong>Preparation only</strong>
                  <span>This action does not register or transmit the record.</span>
                </div>
                <button className={styles.primaryButton} type="submit">
                  Continue to documentary review →
                </button>
              </div>
            </form>
          ) : null}

          {phase === "review" ? (
            <section className={styles.panel}>
              <div className={styles.eyebrow}>Stage 02 · Documentary review</div>
              <h2>Review before registration</h2>
              <p className={styles.description}>
                Confirm that every declaration accurately reflects the originating
                correspondence and accompanying source document.
              </p>
              <div className={styles.reviewSummary}>
                <span>External source</span>
                <strong>{values.operationalReference}</strong>
                <small>
                  {values.buyerName} · {values.commodity}
                </small>
              </div>
              <div className={styles.reviewHeading}>
                <span>Recorded particulars</span>
                <small>Operator transcription · Not independently verified</small>
              </div>
              <dl className={styles.review}>
                <div>
                  <dt>Introduction channel</dt>
                  <dd>
                    {introductionChannelName.trim() ||
                      "Direct / not stated"}
                  </dd>
                </div>
                {FIELDS.map((field) => (
                  <div key={field.name}>
                    <dt>{field.label}</dt>
                    <dd>{values[field.name]}</dd>
                  </div>
                ))}
                <div>
                  <dt>Evidence document</dt>
                  <dd>{file?.name}</dd>
                </div>
              </dl>
              <div className={styles.reviewHeading}>
                <span>Authority and registration boundary</span>
              </div>
              <div className={styles.notice}>
                Registration records provenance and preserves documentary evidence.
                It does not authenticate the buyer, grant representative authority,
                promote an opportunity, authorize settlement, or transfer custody
                of physical goods.
              </div>
              <label className={styles.confirmation}>
                <span>Type <strong>REGISTER EXTERNAL INTAKE</strong> to authorize registration.</span>
                <input
                  value={confirmation}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
              </label>
              {error && <p role="alert" className={styles.error}>{error}</p>}
              <div className={styles.actions}>
                <button type="button" className={styles.secondaryButton} disabled={pending} onClick={() => setPhase("entry")}>
                  Revise particulars
                </button>
                <button type="button" className={styles.primaryButton}
                  disabled={pending || confirmation !== "REGISTER EXTERNAL INTAKE"}
                  onClick={register}>
                  {pending ? "Registering…" : "Register external intake"}
                </button>
              </div>
            </section>
          ) : null}

          {phase === "complete" && receipt ? (
            <section className={styles.panel}>
              <div className={styles.eyebrow}>Stage 03 · Documentary receipt</div>
              <h2>{receipt.intake?.alreadyRegistered ? "Existing registration confirmed" : "External intake registered"}</h2>
              <p className={styles.description}>Private custody and database registration have returned an accepted receipt.</p>
              <dl className={styles.review}>
                <div><dt>Reference</dt><dd>{receipt.intake?.reference || "Not supplied"}</dd></div>
                <div><dt>Intake identity</dt><dd>{receipt.intake?.id || "Not supplied"}</dd></div>
                <div><dt>Custody reference</dt><dd>{receipt.evidence?.reference || "Not supplied"}</dd></div>
                <div><dt>Evidence SHA-256</dt><dd className={styles.hash}>{receipt.evidence?.sha256 || "Not supplied"}</dd></div>
                <div><dt>Storage disposition</dt><dd>{receipt.evidence?.disposition || "Not supplied"}</dd></div>
              </dl>
              <div className={styles.notice}>Authority remains unverified or ungranted. No settlement or opportunity promotion was executed.</div>
              <div className={styles.actions}>
                <Link className={styles.primaryButton} href="/admin/transaction-intakes">
                  Return to intake registry
                </Link>
              </div>
            </section>
          ) : null}
        </div>

        <aside
          id="fw-transaction-documentary-rail"
          className={styles.rail}
          hidden={!railOpen}
        >
          <div className={styles.railHeading}>Documentary control</div>

          <div className={styles.railSection}>
            <span className={styles.railKicker}>Origin</span>
            <strong>External correspondence</strong>
            <p>Operator-entered particulars derived from an originating source.</p>
          </div>

          <div className={styles.railSection}>
            <span className={styles.railKicker}>Custody</span>
            <strong>Private evidence preservation</strong>
            <p>A durable PDF reference and SHA-256 integrity receipt accompany registration.</p>
          </div>

          <div className={styles.railSection}>
            <span className={styles.railKicker}>Authority</span>
            <strong>Unverified · Not granted</strong>
            <p>Registration does not confer negotiation, signing, delivery, or settlement authority.</p>
          </div>

          <div className={styles.railFooter}>
            <span>Control principle</span>
            <strong>Record ≠ Authority</strong>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Section({
  number, title, description, children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.eyebrow}>Preparation · {number} / 04</div>
      <h2>{title}</h2>
      <p className={styles.description}>{description}</p>
      <div className={styles.fields}>{children}</div>
    </section>
  );
}

function Fields({
  group, values, onChange,
}: {
  group: (typeof FIELDS)[number]["group"];
  values: Values;
  onChange: (value: Values) => void;
}) {
  return (
    <>
      {FIELDS.filter((field) => field.group === group).map((field) => (
        <label className={styles.field} key={field.name}>
          <span>{field.label}</span>
          <input
            required
            maxLength={field.name === "submitterEmail" ? 320 : 2000}
            type={field.name === "submitterEmail" ? "email" : "text"}
            name={field.name}
            value={values[field.name]}
            placeholder={field.placeholder}
            onChange={(event) =>
              onChange({ ...values, [field.name]: event.target.value })
            }
          />
        </label>
      ))}
    </>
  );
}
