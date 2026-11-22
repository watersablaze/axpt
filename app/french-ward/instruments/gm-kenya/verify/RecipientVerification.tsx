"use client";
import { useState } from "react";
import type { FormEvent } from "react";
import styles from "./page.module.css";

export function RecipientVerification({ emailHint }: { emailHint: string }) {
  const [sent, setSent] = useState(false);
  const [busyAction, setBusyAction] = useState<"send" | "verify" | null>(null);
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function send() {
    if (busyAction) return;
    setBusyAction("send"); setError(""); setMessage("");
    try {
      const response = await fetch("/french-ward/instruments/gm-kenya/verify/request", { method: "POST" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to send code.");
      setSent(true); setPin(""); setMessage("Code sent. Check your inbox and spam folder.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to send code."); }
    finally { setBusyAction(null); }
  }
  async function confirm(event: FormEvent) {
    event.preventDefault();
    if (busyAction || pin.length !== 6) return;
    setBusyAction("verify"); setError(""); setMessage("");
    try {
      const response = await fetch("/french-ward/instruments/gm-kenya/verify/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Unable to verify code.");
      window.location.assign("/french-ward/instruments/gm-kenya");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to verify code."); setBusyAction(null);
    }
  }
  return <div className={styles.verification}>
    <p>A one-time code will be sent to <strong>{emailHint}</strong>.</p>
    <button type="button" onClick={send} disabled={busyAction !== null}>{busyAction === "send" ? "Sending…" : sent ? "Resend code" : "Send verification code"}</button>
    {sent ? <form onSubmit={confirm}>
      <label htmlFor="gm-recipient-code">Six-digit code</label>
      <input id="gm-recipient-code" inputMode="numeric" autoComplete="one-time-code"
        pattern="[0-9]{6}" maxLength={6} value={pin} required disabled={busyAction !== null}
        onChange={event => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))} />
      <button disabled={busyAction !== null || pin.length !== 6}>{busyAction === "verify" ? "Verifying…" : "Verify & open Framework"}</button>
    </form> : null}
    {message ? <p role="status">{message}</p> : null}
    {error ? <p role="alert">{error}</p> : null}
  </div>;
}
