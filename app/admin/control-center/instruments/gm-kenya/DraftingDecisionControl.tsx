"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

type Props = { versionId: string; receiptIds: string[]; distinctInstitutions: number };
export function DraftingDecisionControl({ versionId, receiptIds, distinctInstitutions }: Props) {
  const router = useRouter();
  const [standing, setStanding] = useState<"REVIEW_HOLD" | "OPEN_DRAFTING">("REVIEW_HOLD");
  const [rationale, setRationale] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const decisionKey = useRef<string | null>(null);
  async function record() {
    if (busy || saved || !reviewed || rationale.trim().length < 20) return;
    decisionKey.current ??= crypto.randomUUID();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/instruments/gm-kenya/drafting-decision", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId, standing, rationale: rationale.trim(),
          reviewedReceiptIds: receiptIds, decisionKey: decisionKey.current,
          confirmation: "RECORD DRAFTING DECISION" }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Decision could not be recorded");
      setSaved(true); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Decision could not be recorded"); }
    finally { setBusy(false); }
  }
  return <div className={styles.draftingControl}>
    <h3>Operator review decision</h3>
    <p>Record whether review remains open or whether AXPT may begin preparing a proposed master agreement. This does not bind any institution.</p>
    <label className={styles.draftingChoice}>Standing <select value={standing} onChange={event => {
      setStanding(event.target.value as "REVIEW_HOLD" | "OPEN_DRAFTING"); decisionKey.current = null;
    }}>
      <option value="REVIEW_HOLD">Hold for further review</option>
      <option value="OPEN_DRAFTING" disabled={distinctInstitutions < 2}>Open proposed drafting</option>
    </select></label>
    {distinctInstitutions < 2 ? <p>Drafting requires recorded responses from at least two distinct represented institutions.</p> : null}
    <label className={styles.draftingBasis}>Decision basis <textarea value={rationale} maxLength={4000} rows={4} onChange={event => {
      setRationale(event.target.value); decisionKey.current = null;
    }} /></label>
    <label className={styles.reviewAttestation}><input type="checkbox" checked={reviewed} onChange={event => setReviewed(event.target.checked)} /> I have reviewed all {receiptIds.length} recorded response sets and their presented capacities.</label>
    <button className={styles.draftingAction} type="button" disabled={busy || saved || !reviewed || rationale.trim().length < 20} onClick={record}>
      {busy ? "Recording…" : "Record operator decision"}
    </button>
    {saved ? <p role="status">Decision recorded.</p> : null}
    {error ? <p role="alert">{error}</p> : null}
  </div>;
}
