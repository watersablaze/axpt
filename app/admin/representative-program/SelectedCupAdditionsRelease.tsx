"use client";
import styles from "./operator-panels.module.css";
import { useEffect, useRef, useState } from "react";
type Resource = {id: string; resourceId: string; label: string | null; state: string;
  canView: boolean; canDownload: boolean; canPresent: boolean; canTransmit: boolean;
  commercialPaper?: {status: string; referenceStatus: string | null; previewHref: string} | null};
type Review = {packageId: string; packageReference: string; participantId: string; reviewHash: string; resources: Resource[]};
const endpoint = "/api/admin/representative-program/commercial-utility-packs/release-additions";
const button = "rounded border border-amber-800 px-3 py-2 text-xs text-amber-200 disabled:opacity-50";
export default function SelectedCupAdditionsRelease({packageId, participantId, resources, disabled, onStart, onComplete}: {
  packageId: string; participantId: string; resources: Resource[]; disabled: boolean;
  onStart: () => void; onComplete: (message: string) => Promise<void>;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [review, setReview] = useState<Review | null>(null);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const inFlight = useRef(false), mounted = useRef(false);
  useEffect(() => {mounted.current = true; return () => {mounted.current = false;};}, []);
  function clearReview() {setReview(null); setConfirmed(false); setReason("");}
  async function loadReview() {
    if (disabled || inFlight.current || !selected.length || selected.length > 5) return;
    inFlight.current = true; setBusy(true); setMessage(""); clearReview();
    try {
      const query = new URLSearchParams({packageId});
      for (const id of selected) query.append("resourceReleaseId", id);
      const response = await fetch(endpoint + "?" + query, {cache: "no-store"});
      const payload = await response.json();
      if (!response.ok || payload.ok !== true) throw new Error("Review unavailable");
      const loaded: Review = payload.review;
      if (loaded.packageId !== packageId || loaded.participantId !== participantId ||
        loaded.resources.length !== selected.length || new Set(loaded.resources.map(resource => resource.id)).size !== selected.length ||
        loaded.resources.some(resource => resource.state !== "WITHHELD" || !selected.includes(resource.id)))
        throw new Error("Review identity differs");
      if (mounted.current) setReview(loaded);
    } catch {
      if (mounted.current) setMessage("Review unavailable. Reload persisted CUP state before retrying.");
    } finally {
      inFlight.current = false; if (mounted.current) setBusy(false);
    }
  }
  async function release() {
    if (disabled || inFlight.current || !review || !confirmed || !reason.trim()) return;
    inFlight.current = true; setBusy(true); setMessage(""); onStart();
    let outcome = "Release outcome is unconfirmed. Inspect the reloaded state before another decision.";
    try {
      const response = await fetch(endpoint, {method: "POST", cache: "no-store",
        headers: {"Content-Type": "application/json"}, body: JSON.stringify({packageId,
          resourceReleaseIds: review.resources.map(resource => resource.id), reviewHash: review.reviewHash,
          reason: reason.trim(), confirmRelease: true})});
      const payload = await response.json();
      outcome = response.ok && payload.ok === true
        ? "Selected additions released. Existing permissions are unchanged; review permissions separately."
        : "Release was not confirmed. Inspect the reloaded state and obtain a fresh review before retrying.";
    } catch { /* A lost response is not evidence that the transaction failed. */ }
    finally {
      inFlight.current = false;
      if (mounted.current) {
        clearReview(); setSelected([]); setBusy(false);
        await onComplete(outcome);
      }
    }
  }
  return <details className={styles.releaseTool}>
    <summary>Release selected additions</summary>
    <p className="mt-2 text-xs leading-5 text-gray-400">
      Select up to five withheld resources. Release preserves their current permissions and does not send a notification.
    </p>
    <fieldset disabled={disabled || busy} className="mt-3 space-y-2">
      <legend className="sr-only">Withheld additions</legend>
      {resources.map(resource => <label key={resource.id} className="flex items-start gap-2 text-xs text-gray-300">
        <input type="checkbox" checked={selected.includes(resource.id)}
          disabled={!selected.includes(resource.id) && selected.length >= 5}
          onChange={event => {const checked = event.target.checked;
            setSelected(current => checked ? [...current, resource.id] : current.filter(id => id !== resource.id));
            clearReview(); setMessage("");}} />
        {resource.label || resource.resourceId}
      </label>)}
      <button type="button" className={button} disabled={!selected.length} onClick={() => void loadReview()}>
        {busy && !review ? "Loading review…" : "Review Selected Additions"}
      </button>
    </fieldset>
    {review ? <fieldset disabled={disabled || busy} className={styles.releaseDecision}>
      <legend className="sr-only">Reviewed release decision</legend>
      <p className="break-all font-mono text-xs text-gray-400">{review.packageReference}</p>
      <ul className="space-y-2 text-xs text-gray-300">{review.resources.map(resource => <li key={resource.id}>
        <p>{resource.label || resource.resourceId}</p>
        {resource.commercialPaper ? <div className="mt-2 text-amber-200">
          <p>{resource.commercialPaper.status}</p>
          {resource.commercialPaper.referenceStatus ? <p>Reference: {resource.commercialPaper.referenceStatus}</p> : null}
          <a href={resource.commercialPaper.previewHref} target="_blank" rel="noreferrer" className="underline">Preview reviewed paper ↗</a>
          <p>CUP release grants reading access under the displayed permissions. It does not issue this paper.</p>
        </div> : null}
        <p className="mt-1 text-gray-500">Permissions remain: View {resource.canView ? "permitted" : "withheld"} · Download {resource.canDownload ? "permitted" : "withheld"} · Present {resource.canPresent ? "permitted" : "withheld"} · Transmit {resource.canTransmit ? "permitted" : "withheld"}</p>
      </li>)}</ul>
      <label className="block text-xs text-gray-300">Release reason
        <textarea value={reason} rows={2} maxLength={4000} onChange={event => {setReason(event.target.value); setConfirmed(false);}}
          className="mt-1 w-full rounded border border-gray-700 bg-black p-2 text-sm text-white" />
      </label>
      <label className="flex items-start gap-2 text-xs text-amber-200">
        <input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />
        I confirm release of these selected additions under their displayed permissions.
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={button} disabled={!confirmed || !reason.trim()} onClick={() => void release()}>Record Selected Release</button>
        <button type="button" className={button} onClick={clearReview}>Cancel Review</button>
      </div>
    </fieldset> : null}
    {message ? <p role="status" className="mt-2 text-xs text-amber-200">{message}</p> : null}
  </details>;
}
