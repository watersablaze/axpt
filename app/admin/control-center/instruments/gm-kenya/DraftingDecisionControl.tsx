"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

import type { globalMotherDraftingGate } from "@/domains/instruments/invariants/globalMotherDraftingGate";
type Props = { versionId: string; receiptIds: string[]; gate: ReturnType<typeof globalMotherDraftingGate> };
export function DraftingDecisionControl({ versionId, receiptIds, gate }: Props) {
  const router = useRouter();
  const [standing, setStanding] = useState<"REVIEW_HOLD" | "OPEN_DRAFTING">("REVIEW_HOLD");
  const [rationale, setRationale] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [treatments, setTreatments] = useState<Record<string, string>>({});
  const [carried, setCarried] = useState<Record<string, boolean>>({});
  const treatmentsComplete = gate.issues.every(issue => {
    const key = `${issue.receiptId}:${issue.reference}`;
    return carried[key] && (treatments[key]?.trim().length ?? 0) >= 20;
  });
  const openingBlocked = standing === "OPEN_DRAFTING" && (!gate.canOpen || !treatmentsComplete);
  const decisionKey = useRef<string | null>(null);
  async function record() {
    if (busy || saved || openingBlocked || !reviewed || rationale.trim().length < 20) return;
    decisionKey.current ??= crypto.randomUUID();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/instruments/gm-kenya/drafting-decision", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId, standing, rationale: rationale.trim(),
          reviewedReceiptIds: receiptIds, decisionKey: decisionKey.current,
          dispositions: standing === "OPEN_DRAFTING" ? gate.issues.map(issue => ({
            receiptId: issue.receiptId, reference: issue.reference, treatment: "CARRY_TO_DRAFTING",
            note: treatments[`${issue.receiptId}:${issue.reference}`].trim(),
          })).sort((a,b) => `${a.receiptId}:${a.reference}`.localeCompare(`${b.receiptId}:${b.reference}`)) : [],
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
      <option value="OPEN_DRAFTING" disabled={!gate.canOpen}>Open proposed drafting</option>
    </select></label>
    {gate.missingInstitutions.length ? <p>Drafting requires recorded responses from: {gate.missingInstitutions.join(" and ")}. Other institution labels do not satisfy this threshold.</p> : null}
    {gate.invalidResponses ? <p role="alert">A response record requires integrity review before drafting.</p> : null}
    {gate.issues.some(issue => issue.responseType === "DECLINE") ? <p>A declined position requires further review. Drafting remains held.</p> : null}
    {standing === "OPEN_DRAFTING" && gate.issues.length > 0 ? <div>
      <h4>Outstanding positions</h4>
      <p>Explain how each point will be addressed in the proposed draft. The recipient response remains unchanged and unresolved.</p>
      {gate.issues.map(issue => {
        const key = `${issue.receiptId}:${issue.reference}`;
        return <fieldset key={key}>
          <legend>{issue.institution} · {issue.reference} · {issue.responseType}</legend>
          <p>{issue.note}</p>
          <label><input type="checkbox" checked={Boolean(carried[key])} onChange={event => {
            setCarried(current => ({ ...current, [key]: event.target.checked })); decisionKey.current = null;
          }} /> Carry this open point into drafting for explicit treatment.</label>
          <label className={styles.draftingBasis}>Treatment in the draft · required
            <textarea rows={3} maxLength={1000} value={treatments[key] ?? ""} onChange={event => {
              setTreatments(current => ({ ...current, [key]: event.target.value })); decisionKey.current = null;
            }} />
          </label>
        </fieldset>;
      })}
    </div> : null}
    <label className={styles.draftingBasis}>Decision basis <textarea value={rationale} maxLength={2000} rows={4} onChange={event => {
      setRationale(event.target.value); decisionKey.current = null;
    }} /></label>
    <label className={styles.reviewAttestation}><input type="checkbox" checked={reviewed} onChange={event => setReviewed(event.target.checked)} /> I have reviewed all {receiptIds.length} recorded response sets and their presented capacities.</label>
    <button className={styles.draftingAction} type="button" disabled={busy || saved || openingBlocked || !reviewed || rationale.trim().length < 20} onClick={record}>
      {busy ? "Recording…" : "Record operator decision"}
    </button>
    {saved ? <p role="status">Decision recorded.</p> : null}
    {error ? <p role="alert">{error}</p> : null}
  </div>;
}
