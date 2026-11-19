"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BuyerDossierAccessControls(props: {
  dossierId: string;
  recipientName: string;
  expiresAt: string;
  canExtend: boolean;
  canRetryNotice: boolean;
}) {
  const router = useRouter();
  const [days, setDays] = useState<14 | 30 | 60>(30);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function act(action: "extend" | "retry-notice") {
    const prompt = action === "extend"
      ? `Extend ${props.recipientName}'s current dossier AND existing grants by ${days} days? No documents or grants will be reissued.`
      : `Send one new access notice to ${props.recipientName}'s registered email? A new attempt will be audited; uncertain sends cannot be repeated.`;
    if (!window.confirm(prompt)) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(
        `/api/admin/representative-program/buyer-dossiers/${action}`,
        { method: "POST", credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action === "extend"
            ? { dossierId: props.dossierId, days, expectedExpiresAt: props.expiresAt }
            : { dossierId: props.dossierId }) },
      );
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setMessage(`Not completed: ${result.error ?? "request rejected"}`);
      } else {
        setMessage(action === "extend"
          ? `Extended through ${result.result.expiresAt}. Refreshing record.`
          : `Recorded recipient notice attempt: ${result.result.status}. This is not proof of inbox delivery.`);
        router.refresh();
      }
    } catch {
      setMessage("Outcome not confirmed. Check the administration record before trying again.");
    } finally { setBusy(false); }
  }

  return <section className="mt-4 rounded border border-slate-700 p-3" aria-label="Buyer dossier access administration">
    <p className="text-sm font-semibold">Access administration</p>
    <p className="mt-1 text-xs text-gray-400">Existing dossier and publication grants only. No automatic reissuance.</p>
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <select aria-label="Additional access duration" value={days}
        disabled={busy || !props.canExtend}
        onChange={event => setDays(Number(event.target.value) as 14 | 30 | 60)}
        className="rounded border border-gray-600 bg-gray-900 px-2 py-2 text-sm">
        <option value={14}>Add 14 days</option>
        <option value={30}>Add 30 days</option>
        <option value={60}>Add 60 days</option>
      </select>
      <button type="button" disabled={busy || !props.canExtend}
        onClick={() => void act("extend")}
        className="rounded border border-sky-600 px-3 py-2 text-sm text-sky-100 disabled:opacity-40">
        Extend Existing Access
      </button>
      <button type="button" disabled={busy || !props.canRetryNotice}
        onClick={() => void act("retry-notice")}
        className="rounded border border-amber-600 px-3 py-2 text-sm text-amber-100 disabled:opacity-40">
        Resend Access Notice
      </button>
    </div>
    <p className="mt-2 text-xs text-gray-400">
      Retry is available only for a known ACCESS_UNAVAILABLE failure, after access is valid.
      Accepted provider status does not confirm recipient viewing.
    </p>
    {message && <p role="status" className="mt-2 text-sm">{message}</p>}
  </section>;
}
