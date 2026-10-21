"use client";
import styles from "./operator-panels.module.css";
import { useEffect, useRef, useState } from "react";
type Paper = {key: string; reference: string; version: number; title: string; status: string;
  referenceStatus: string | null; contentHash: string; previewHref: string};
const endpoint = "/api/admin/representative-program/commercial-utility-packs/commercial-papers";
export default function CommercialPaperAdditions({packageId, participantId, disabled, onStart, onComplete}: {
  packageId: string; participantId: string; disabled: boolean; onStart: () => void;
  onComplete: (message: string) => Promise<void>;
}) {
  const [papers, setPapers] = useState<Paper[]>([]), [selected, setSelected] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false), [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false), generation = useRef(0);
  useEffect(() => {
    ++generation.current;
    setPapers([]); setSelected([]); setConfirmed(false); setMessage(""); setBusy(false);
    return () => {++generation.current;};
  }, [packageId, participantId]);
  async function reviewCandidates() {
    if (disabled || inFlight.current) return;
    const current = generation.current;
    inFlight.current = true; setBusy(true); setPapers([]); setSelected([]); setConfirmed(false); setMessage("");
    try {
      const response = await fetch(endpoint + "?" + new URLSearchParams({packageId}), {cache: "no-store"});
      const payload = await response.json();
      if (!response.ok || payload.ok !== true || payload.packageId !== packageId ||
          payload.participantId !== participantId || !Array.isArray(payload.papers)) throw new Error("Review unavailable");
      if (current === generation.current) setPapers(payload.papers);
    } catch {if (current === generation.current) setMessage("Candidate review unavailable. Reload CUP state and try again.");}
    finally {inFlight.current = false; if (current === generation.current) setBusy(false);}
  }
  async function stage() {
    if (disabled || inFlight.current || !confirmed || !selected.length) return;
    const current = generation.current;
    inFlight.current = true; setBusy(true); setMessage(""); onStart();
    let outcome = "Staging outcome is unconfirmed. Inspect reloaded CUP state before retrying.";
    try {
      const response = await fetch(endpoint, {method: "POST", cache: "no-store",
        headers: {"Content-Type": "application/json"}, body: JSON.stringify({packageId, keys: selected,
          expectedContentHashes: Object.fromEntries(papers.filter(paper => selected.includes(paper.key)).map(paper => [paper.key, paper.contentHash])),
          confirmPreparedStatus: true})});
      const payload = await response.json();
      outcome = response.ok && payload.ok === true
        ? "Commercial papers staged as withheld additions. Review their separate release decision below."
        : "Staging was not confirmed. Reload state and obtain a fresh candidate review before retrying.";
    } catch { /* Reload persisted state even when the response is lost. */ }
    finally {
      inFlight.current = false;
      if (current === generation.current) {
        setPapers([]); setSelected([]); setConfirmed(false);
        try {await onComplete(outcome);} finally {if (current === generation.current) setBusy(false);}
      }
    }
  }
  return <details className={styles.additionsTool}>
    <summary><span>Prepare commercial additions</span><span className={styles.summaryMeta}>TOV / SCO</span></summary>
    <div className={styles.toolBody}>
      <p className={styles.toolCopy}>Preview and stage papers as withheld additions. Release and permissions are separate decisions.</p>
      <button type="button" disabled={disabled || busy} onClick={() => void reviewCandidates()} className={styles.primaryButton}>
        {busy ? "Working…" : "Review Commercial Papers"}
      </button>
      {papers.length ? <fieldset disabled={disabled || busy} className={styles.paperSelection}>
        <legend className="sr-only">Commercial paper selection</legend>
        <p className={styles.selectionCount} aria-live="polite">{selected.length} of {papers.length} selected</p>
        <div className={styles.paperList}>
          {papers.map(paper => <div key={paper.key} className={styles.paperRow}>
            <label className={styles.paperLabel}><input type="checkbox" checked={selected.includes(paper.key)}
              onChange={event => {const checked = event.target.checked;
                setSelected(current => checked ? [...current, paper.key] : current.filter(key => key !== paper.key)); setConfirmed(false);}} />
              <span><strong>{paper.title}</strong><span className={styles.paperReference}>{paper.reference} · Edition {paper.version}</span></span>
            </label>
            <div className={styles.paperStanding}><p>{paper.status}</p>
              {paper.referenceStatus ? <p className={styles.referenceNote}>Reference: {paper.referenceStatus}</p> : null}
            </div>
            <a href={paper.previewHref} target="_blank" rel="noreferrer" className={styles.previewLink}>Preview ↗</a>
          </div>)}
        </div>
        <div className={styles.decisionFooter}>
          <label className={styles.confirmation}><input type="checkbox" checked={confirmed}
            onChange={event => setConfirmed(event.target.checked)} />
            <span>I acknowledge the prepared status and references. Staging does not issue or release these papers.</span>
          </label>
          <p className={styles.toolCopy}>View becomes available after release. Download, presentation and transmission start withheld.</p>
          <button type="button" disabled={!confirmed || !selected.length} onClick={() => void stage()} className={styles.primaryButton}>Stage Selected Papers</button>
        </div>
      </fieldset> : null}
      {message ? <p role="status" className={styles.notice}>{message}</p> : null}
    </div>
  </details>;
}
