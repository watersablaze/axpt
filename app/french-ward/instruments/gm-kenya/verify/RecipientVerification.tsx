"use client";
import { useState } from "react";
import type { FormEvent } from "react";
import styles from "./page.module.css";

export function RecipientVerification({ emailHint }: { emailHint: string }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function send() {
    if (busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/french-ward/instruments/gm-kenya/verify/request", { method: "POST" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to send code.");
      setSent(true); setPin(""); setMessage("Code sent. Check your inbox and spam folder.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to send code."); }
    finally { setBusy(false); }
  }
  async function confirm(event: FormEvent) {
    event.preventDefault();
    if (busy || pin.length !== 6) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/french-ward/instruments/gm-kenya/verify/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Unable to verify code.");
      window.location.assign("/french-ward/instruments/gm-kenya");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to verify code."); setBusy(false);
    }
  }
  return <div className={styles.verification}>
    <p>A one-time code will be sent to <strong>{emailHint}</strong>.</p>
    <button type="button" onClick={send} disabled={busy}>{busy ? "Please wait…" : sent ? "Resend code" : "Send verification code"}</button>
    {sent ? <form onSubmit={confirm}>
      <label htmlFor="gm-recipient-code">Six-digit code</label>
      <input id="gm-recipient-code" inputMode="numeric" autoComplete="one-time-code"
        pattern="[0-9]{6}" maxLength={6} value={pin} required disabled={busy}
        onChange={event => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))} />
      <button disabled={busy || pin.length !== 6}>{busy ? "Verifying…" : "Verify & open Framework"}</button>
    </form> : null}
    {message ? <p role="status">{message}</p> : null}
    {error ? <p role="alert">{error}</p> : null}
  </div>;
}
