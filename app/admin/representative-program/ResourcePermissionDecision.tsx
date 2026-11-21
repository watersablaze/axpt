"use client";
import styles from "./operator-panels.module.css";

import { useRef, useState } from "react";

const fields = [
  ["canView", "View"],
  ["canDownload", "Personal download"],
  ["canPresent", "Present"],
  ["canTransmit", "Transmit"],
] as const;

type Permissions = {
  canView: boolean;
  canDownload: boolean;
  canPresent: boolean;
  canTransmit: boolean;
};
type Review = {
  resourceReleaseId: string;
  participantId: string;
  packageReference: string;
  resourceId: string;
  label: string | null;
  reviewHash: string;
  permissions: Permissions;
};

const endpoint =
  "/api/admin/representative-program/commercial-utility-packs/resource-permissions";

export default function ResourcePermissionDecision({
  resourceReleaseId,
  participantId,
  disabled,
  onDecision,
}: {
  resourceReleaseId: string;
  participantId: string;
  disabled: boolean;
  onDecision: () => Promise<void>;
}) {
  const [review, setReview] = useState<Review | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const inFlight = useRef(false);

  function clearReview() {
    setReview(null);
    setPermissions(null);
    setReason("");
    setConfirmed(false);
  }

  async function loadReview() {
    if (disabled || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setMessage("");
    clearReview();
    try {
      const query = new URLSearchParams({ resourceReleaseId });
      const response = await fetch(endpoint + "?" + query, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || payload.ok !== true) {
        throw new Error("Permission review unavailable.");
      }
      const loaded: Review = payload.review;
      if (
        loaded.resourceReleaseId !== resourceReleaseId ||
        loaded.participantId !== participantId
      ) throw new Error("Resource review identity differs.");

      setReview(loaded);
      setPermissions({ ...loaded.permissions });
    } catch {
      setMessage("Review could not be loaded. Reload persisted CUP state and retry.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function submit() {
    if (
      disabled || inFlight.current || !review || !permissions ||
      !confirmed || !reason.trim()
    ) return;
    inFlight.current = true;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          resourceReleaseId,
          reviewHash: review.reviewHash,
          permissions,
          reason: reason.trim(),
          confirmDecision: true,
        }),
      });
      const payload = await response.json();
      clearReview();

      if (!response.ok || payload.ok !== true) {
        setMessage("Decision was not confirmed. Reload and obtain a fresh review before retrying.");
      } else {
        setMessage(payload.result.changed
          ? "Permission decision recorded."
          : "Reviewed permissions are unchanged.");
      }
      await onDecision();
    } catch {
      clearReview();
      setMessage("Outcome is unconfirmed. Reload persisted state before making another decision.");
      await onDecision();
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  const locked = disabled || busy;
  const incoherent = permissions && !permissions.canView &&
    (permissions.canDownload || permissions.canPresent || permissions.canTransmit);

  return (
    <div className={styles.permissionControl}>
      {!review ? (
        <button type="button" disabled={locked} onClick={() => void loadReview()}
          className="rounded border border-cyan-800 px-3 py-2 text-xs text-cyan-200 disabled:opacity-50">
          {busy ? "Loading review…" : "Review Resource Permissions"}
        </button>
      ) : (
        <fieldset disabled={locked}
          className={styles.permissionDecision}>
          <legend className="px-1 text-xs text-amber-200">Resource Permission Decision</legend>
          <p className="break-words text-xs text-gray-300">
            {review.label || review.resourceId}
          </p>
          <p className="mt-1 break-words font-mono text-xs text-gray-500">
            {review.packageReference}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {fields.map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-xs text-gray-300">
                <input type="checkbox" checked={permissions?.[key] ?? false}
                  onChange={event => {
                    const checked = event.target.checked;
                    setPermissions(current => current
                      ? { ...current, [key]: checked } : null);
                    setConfirmed(false);
                  }} />
                {label}
                <span className="text-gray-500">
                  (currently {review.permissions[key] ? "permitted" : "withheld"})
                </span>
              </label>
            ))}
          </div>
          {incoherent ? (
            <p className="mt-2 text-xs text-amber-300">
              View must remain permitted when other resource uses are permitted.
            </p>
          ) : null}
          <label className="mt-3 block text-xs text-gray-300">
            Decision reason
            <textarea value={reason} maxLength={4000} rows={3}
              onChange={event => {
                setReason(event.target.value);
                setConfirmed(false);
              }}
              className="mt-2 w-full rounded border border-gray-700 bg-black p-2 text-sm text-white" />
          </label>
          <p className="mt-3 text-xs leading-5 text-gray-400">
            Resource permissions do not grant delegated authority or send materials.
            Original release history is preserved.
          </p>
          <label className="mt-3 flex items-start gap-2 text-xs text-amber-200">
            <input type="checkbox" checked={confirmed}
              onChange={event => setConfirmed(event.target.checked)} />
            I confirm this resource permission decision and its recorded reason.
          </label>
          <div className="mt-3 flex gap-2">
            <button type="button"
              disabled={!confirmed || !reason.trim() || Boolean(incoherent)}
              onClick={() => void submit()}
              className="rounded border border-amber-700 px-3 py-2 text-xs text-amber-200 disabled:opacity-50">
              Record Permission Decision
            </button>
            <button type="button" onClick={clearReview}
              className="rounded border border-gray-700 px-3 py-2 text-xs text-gray-300">
              Cancel
            </button>
          </div>
        </fieldset>
      )}
      {message ? <p role="status" className="mt-2 text-xs text-amber-200">{message}</p> : null}
    </div>
  );
}
