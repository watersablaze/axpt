
"use client";
import { useRef, useState } from "react";

type Review = {
  to: string; from: string; subject: string; html: string;
  mode: string; reviewDate: string; reviewHash: string;
  last: { status: string | null; messageId: string | null; createdAt: string } | null;
};

export default function JensWorkspaceAccess({ intakeId }: { intakeId: string }) {
  const [review, setReview] = useState<Review | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  const endpoint = "/api/admin/representative-program/intakes/" +
    encodeURIComponent(intakeId) + "/workspace-access";

  async function load() {
    const response = await fetch(endpoint, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || "Preview unavailable.");
    setReview(result.review);
    setConfirmed(false);
  }
  async function preview() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage("");
    try { await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Preview unavailable."); }
    finally { lock.current = false; setBusy(false); }
  }
  async function send() {
    if (!review || !confirmed || lock.current) return;
    lock.current = true; setBusy(true); setMessage("");
    try {
      const response = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewHash: review.reviewHash, confirmSend: true }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Send unavailable.");
      setMessage(result.delivery.mode === "send"
        ? "Email accepted by the mail provider. Delivery receipt recorded."
        : "Recorded in log mode. No email was sent.");
      await load();
    } catch (error) {
      setConfirmed(false);
      setMessage(error instanceof Error ? error.message : "Send unavailable.");
    } finally { lock.current = false; setBusy(false); }
  }
  const blocked = review?.last &&
    ["SENT", "PENDING", "DELIVERY_UNKNOWN"].includes(review.last.status || "");

  return (
    <section className="rounded border border-cyan-500/20 bg-gray-950 p-4">
      <h3 className="text-sm font-semibold text-gray-100">Workspace Access Email</h3>
      <p className="mt-2 text-xs leading-5 text-gray-400">
        Live workspace announcement for Jens, including buyer invitations and optional LOI access. Contains no PIN or private token.
      </p>
      <button type="button" disabled={busy} onClick={() => void preview()}
        className="mt-3 rounded border border-cyan-700 px-3 py-2 text-xs text-cyan-200 disabled:opacity-50">
        Preview Workspace Access Email
      </button>
      {review ? (
        <div className="mt-4 space-y-3">
          <p className="break-words text-xs text-gray-300">
            To: {review.to}<br />From: {review.from}<br />Subject: {review.subject}
          </p>
          <p className="text-xs text-amber-200">
            Mode: {review.mode === "send" ? "Live email" : "Log only — no outbound email"}.
            {" "}Reviewed date: {review.reviewDate}.
            {" "}Latest status: {review.last?.status || "NOT SENT"}.
          </p>
          {review.last?.messageId ? (
            <p className="break-all font-mono text-xs text-gray-400">{review.last.messageId}</p>
          ) : null}
          <iframe title="Workspace access email preview" srcDoc={review.html}
            sandbox="" className="h-[640px] w-full border border-gray-700 bg-white" />
          <label className="flex items-start gap-2 text-xs leading-5 text-gray-300">
            <input type="checkbox" checked={confirmed} disabled={busy || Boolean(blocked)}
              onChange={event => setConfirmed(event.target.checked)} />
            I reviewed Jens’s recipient address and the exact workspace announcement.
          </label>
          <button type="button" disabled={busy || !confirmed || Boolean(blocked)}
            onClick={() => void send()}
            className="rounded border border-emerald-600 px-3 py-2 text-xs text-emerald-200 disabled:opacity-40">
            {busy ? "Working…" : review.mode === "send"
              ? "Send Workspace Access Email" : "Record Preview Only"}
          </button>
          {blocked ? <p className="text-xs text-amber-200">
            Further sending is withheld. Inspect the recorded delivery status.
          </p> : null}
        </div>
      ) : null}
      {message ? <p role="status" className="mt-3 text-xs text-amber-200">{message}</p> : null}
    </section>
  );
}
