"use client";
import { useRef, useState, type FormEvent } from "react";

type Receipt = {
  id: string; recipientName: string; recipientEmail: string;
  recipientDeliveryStatus: string; adminDeliveryStatus: string;
  grant: { expiresAt: string; revokedAt: string | null };
};
const deliveryLabels: Record<string, string> = {
  QUEUED: "Queued", SENDING: "Sending — refresh status",
  ACCEPTED: "Email provider accepted", FAILED: "Needs attention",
  DELIVERY_UNKNOWN: "Delivery uncertain — operator review needed",
  LOGGED_ONLY: "Test mode — no email sent",
};
const deliveryLabel = (status: string) => deliveryLabels[status] || "Status unavailable";

export default function ProfileUseControls({
  resourceReleaseId,
  readOnly = false,
}: {
  resourceReleaseId: string;
  readOnly?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [introductionId, setIntroductionId] = useState<string | null>(null);
  const submission = useRef<{ fields: string; key: string } | null>(null);
  const base = "/api/representative/commercial-utility-packs/resources/" + encodeURIComponent(resourceReleaseId) + "/profile";
  async function present() {
    if (readOnly || pending) return;
    setPending(true); setMessage("");
    try {
      const response = await fetch(base + "/use", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "PRESENT" }), cache: "no-store",
      });
      const result = await response.json();
      const expected = "/representative/resources/" + encodeURIComponent(resourceReleaseId);
      if (!response.ok || !result.ok || result.action !== "PRESENT" || result.url !== expected) throw new Error();
      window.location.assign(expected);
    } catch { setMessage("Presentation is unavailable under your current permissions."); }
    finally { setPending(false); }
  }
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly || pending || introductionId) return;
    const form = new FormData(event.currentTarget);
    const fields = {
      recipientName: String(form.get("recipientName") || "").trim(),
      recipientEmail: String(form.get("recipientEmail") || "").trim().toLowerCase(),
      recipientOrganization: String(form.get("recipientOrganization") || "").trim(),
      purpose: String(form.get("purpose") || "").trim(),
    };
    setPending(true); setMessage("");
    try {
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(fields)));
      const signature = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
      const storageKey = "arp-profile-invitation:" + resourceReleaseId + ":" + signature;
      if (!submission.current || submission.current.fields !== signature) {
        let key: string | null = null;
        try { key = sessionStorage.getItem(storageKey); } catch { /* Storage is optional. */ }
        if (!key || !/^[0-9a-f-]{36}$/i.test(key)) key = crypto.randomUUID();
        submission.current = { fields: signature, key };
        try { sessionStorage.setItem(storageKey, key); } catch { /* In-memory retry remains available. */ }
      }
      const response = await fetch(base + "/invite", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, idempotencyKey: submission.current.key }), cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setMessage(response.status === 403
          ? "Invitation is unavailable under your current appointment or sharing permissions."
          : response.status === 429 ? "Invitation limit reached. Please try later."
          : "The invitation could not be confirmed. Retry with the same details.");
        return;
      }
      setIntroductionId(result.introductionId);
      setReceipt(result.receipt || null);
      setMessage(result.statusUnavailable
        ? "Introduction recorded. Refresh its delivery status before taking further action."
        : "Profile access arranged. Recipient and Admin email status are shown below.");
    } catch { setMessage("The response could not be confirmed. Retry with the same details."); }
    finally { setPending(false); }
  }
  async function refresh() {
    if (readOnly || pending || !introductionId) return;
    setPending(true);
    try {
      const response = await fetch(base + "/invite?introductionId=" + encodeURIComponent(introductionId), { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error();
      setReceipt(result.receipt); setMessage("Delivery status refreshed.");
    } catch { setMessage("Status is temporarily unavailable. The recorded introduction remains in place."); }
    finally { setPending(false); }
  }
  const inputClass = "mt-1 w-full rounded border border-[#567ba0] bg-[#10242d] px-3 py-1.5 text-sm leading-5 text-[#eee7da]";
  const buttonClass = "rounded border border-[#567ba0] px-4 py-2 text-sm text-[#eee7da] disabled:opacity-50";
  return <section aria-labelledby="profile-use-heading" className="my-3 rounded border border-[#30495c] px-4 py-3">
    <div className="flex flex-wrap items-center gap-3">
      <h2 id="profile-use-heading" className="mr-auto text-sm font-medium text-[#eee7da]">
        Official Profile
      </h2>
      <button type="button" disabled={readOnly || pending}
        onClick={present} className={buttonClass}>
        Open for Presentation
      </button>
    </div>
    {readOnly ? (
      <p className="mt-2 text-xs text-[#d8c39b]">
        Read-only preview · Expand the invitation to inspect its fields.
      </p>
    ) : null}

    {!introductionId ? <details className="mt-2">
      <summary className="w-fit cursor-pointer rounded border border-[#567ba0] px-4 py-2 text-sm text-[#eee7da] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d8c39b]">
        Invite to View Profile
      </summary>
      <p className="mt-3 text-xs leading-5 text-[#b7c5ce]">
        Arrange seven days of access for a named recipient and notify French-Ward Administration.
      </p>
      <form onSubmit={invite} className="mt-3 grid max-w-3xl gap-x-3 gap-y-2 sm:grid-cols-2">
      <label className="text-sm text-[#b7c5ce]">Recipient name<input className={inputClass} name="recipientName" maxLength={120} required disabled={readOnly || pending} /></label>
      <label className="text-sm text-[#b7c5ce]">Recipient email<input className={inputClass} name="recipientEmail" type="email" maxLength={254} required disabled={readOnly || pending} /></label>
      <label className="text-sm text-[#b7c5ce]">Organization<input className={inputClass} name="recipientOrganization" maxLength={180} required disabled={readOnly || pending} /></label>
      <label className="text-sm text-[#b7c5ce]">Introduction purpose<textarea className={inputClass} name="purpose" rows={1} maxLength={1000} required disabled={readOnly || pending} /></label>
      <p className="text-xs leading-5 text-[#b7c5ce] sm:col-span-2">Purpose is visible to Admin only; the recipient receives an official Profile invitation.</p>
      <button className={buttonClass + " justify-self-start"} disabled={readOnly || pending} type="submit">{pending ? "Processing…" : "Send Profile Invitation"}</button>
    </form>
    </details> : <div className="mt-3 text-sm leading-6 text-[#b7c5ce]">
      {receipt && <><p>{receipt.recipientName} · {receipt.recipientEmail}</p>
        <p>Recipient email: {deliveryLabel(receipt.recipientDeliveryStatus)}</p>
        <p>Admin notification: {deliveryLabel(receipt.adminDeliveryStatus)}</p>
        <p>Access: {receipt.grant.revokedAt ? "Revoked" : new Date(receipt.grant.expiresAt).getTime() <= Date.now() ? "Expired" : "Granted"}</p>
        <p>Expires: {new Date(receipt.grant.expiresAt).toLocaleString()}</p></>}
      <div className="mt-3 flex flex-wrap gap-3"><button type="button" className={buttonClass} disabled={readOnly || pending} onClick={refresh}>Refresh Status</button>
      <button type="button" className={buttonClass} disabled={readOnly || pending} onClick={() => { setIntroductionId(null); setReceipt(null); setMessage(""); if (submission.current) {
        try { sessionStorage.removeItem("arp-profile-invitation:" + resourceReleaseId + ":" + submission.current.fields); } catch { /* Storage is optional. */ }
      } submission.current = null; }}>Invite Another Recipient</button></div>
    </div>}
    <p role="status" aria-live="polite" className={message ? "mt-3 text-sm text-[#d8c39b]" : "sr-only"}>{message}</p>
  </section>;
}
