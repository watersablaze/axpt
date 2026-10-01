"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export function RevokeV2Control({
  grantId,
  invitationSentAt,
}: {
  grantId: string;
  invitationSentAt: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  async function replaceLink() {
    if (busy || link || !window.confirm("Replace this private link? The old link and recipient sessions will stop working. Recorded responses and the access expiry will remain.")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/instruments/gm-kenya/replace-link", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grantId, confirmation: "REPLACE PRIVATE LINK" }),
      });
      const result = await response.json() as { ok?: boolean; privatePath?: string; error?: string };
      if (!response.ok || !result.ok || !result.privatePath) throw new Error(result.error ?? "Replacement failed");
      setLink(window.location.origin + result.privatePath);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Replacement failed"); }
    finally { setBusy(false); }
  }
  async function emailInvitation() {
    if (
      busy ||
      !window.confirm(
        invitationSentAt
          ? "Resend the official Chamber invitation? AXPT will rotate the private link, invalidate the prior link and active recipient session, then email the fresh credential."
          : "Send the official Chamber invitation? This existing grant predates system delivery, so AXPT will issue a fresh private link and email that credential. Any prior link or active recipient session will stop working.",
      )
    ) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/instruments/gm-kenya/replace-link", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grantId,
          confirmation: "REPLACE PRIVATE LINK",
          sendInvitation: true,
        }),
      });
      const result = await response.json() as {
        ok?: boolean;
        privatePath?: string;
        error?: string;
        invitation?: {
          ok?: boolean;
          mode?: "send" | "log";
          error?: string;
        };
      };
      if (!response.ok || !result.ok || !result.privatePath)
        throw new Error(result.error ?? "Invitation failed");
      if (!result.invitation?.ok) {
        setLink(window.location.origin + result.privatePath);
        setError("A fresh link was issued, but the invitation email was not delivered. Use the recovery link below.");
        return;
      }
      setNotice(
        result.invitation.mode === "send"
          ? "Official Chamber invitation sent. A fresh private link is now active; prior links and sessions are inactive."
          : "Invitation logged only. A fresh private link is active, but outbound email mode is not enabled in this environment.",
      );
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invitation failed");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(link); setCopied(true); setError(""); }
    catch { setError("Select the link below and copy it manually."); }
  }
  async function revoke() {
    if (busy || !window.confirm("Revoke this recipient's current Framework access? Their recorded response will remain.")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/instruments/gm-kenya/revoke-v2", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grantId, confirmation: "REVOKE V3 ACCESS" }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Revocation failed");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Revocation failed"); }
    finally { setBusy(false); }
  }
  return <div className={styles.accessActions}>
    {!link ? <>
      <button className={styles.accessSend} type="button" disabled={busy} onClick={emailInvitation}>
        {busy ? "Working…" : invitationSentAt ? "Resend invitation" : "Send invitation"}
      </button>
      <button className={styles.accessMaintenance} type="button" disabled={busy} onClick={replaceLink}>Replace private link</button>
      {invitationSentAt ? <span className={styles.invitationEvidence}>Sent {new Date(invitationSentAt).toLocaleString()}</span> : null}
      <button className={styles.accessDanger} type="button" disabled={busy} onClick={revoke}>{busy ? "Working…" : "Revoke access"}</button>
    </> : (
      <div className={styles.replacementCredential} role="status">
        <strong>Replacement private link · copy now</strong>
        <p>The prior link and recipient sessions are inactive. This credential is shown for operator recovery and immediate copying.</p>
        <input className={styles.replacementLink} aria-label="Replacement private link" readOnly value={link} onFocus={event => event.currentTarget.select()} />
        <div className={styles.replacementActions}>
          <button className={styles.accessMaintenance} type="button" onClick={copyLink}>{copied ? "Copied" : "Copy private link"}</button>
          <button className={styles.accessMaintenance} type="button" onClick={() => { setLink(""); setCopied(false); router.refresh(); }}>Done</button>
        </div>
      </div>
    )}
    {notice ? <p className={styles.deliveryNotice} role="status">{notice}</p> : null}
    {error ? <p className={styles.accessError} role="alert">{error}</p> : null}
  </div>;
}
