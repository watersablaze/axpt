"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export function GrantV2Control({ versionId }: { versionId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [capacity, setCapacity] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [delivery, setDelivery] = useState("");
  async function grant() {
    if (busy || !email || !name || !institution || !capacity) return;
    setBusy(true); setError(""); setDelivery("");
    try {
      const response = await fetch("/api/admin/instruments/gm-kenya/grant-v2", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId, email, name, institution, capacity }),
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
        throw new Error(result.error ?? "Grant failed");
      setLink(`${window.location.origin}${result.privatePath}`);
      if (result.invitation?.ok) {
        setDelivery(
          result.invitation.mode === "send"
            ? "Access created · official invitation sent."
            : "Access created · invitation logged only. Outbound email mode is not enabled in this environment.",
        );
      } else {
        setDelivery("Access created, but the invitation email was not delivered. Use the private link below or send a fresh invitation from the recipient record.");
      }
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Grant failed"); }
    finally { setBusy(false); }
  }
  return <details className={styles.grantDisclosure}>
    <summary>Create recipient access</summary>
    <div className={styles.grantControl}>
    <p>Create named recipient access to the current Framework. AXPT creates an identity when needed. Verify the email, institution, and capacity before creating the private link.</p>
    <div className={styles.grantFields}>
      <label>Email<input type="email" value={email} autoComplete="off" onChange={e => setEmail(e.target.value)} /></label>
      <label>Name<input value={name} onChange={e => setName(e.target.value)} /></label>
      <label>Represented institution<input value={institution} onChange={e => setInstitution(e.target.value)} /></label>
      <label>Representative capacity<input value={capacity} onChange={e => setCapacity(e.target.value)} /></label>
    </div>
    <button type="button" disabled={busy || !email || !name || !institution || !capacity || Boolean(link)} onClick={grant}>
      {busy ? "Creating…" : "Create access & send invitation"}
    </button>
    {error ? <p role="alert">{error}</p> : null}
    {delivery ? <p className={styles.deliveryNotice} role="status">{delivery}</p> : null}
    {link ? <div className={styles.privateLink} role="status">
      <strong>Private access credential</strong>
      <input readOnly value={link} aria-label="Private Framework access link" onFocus={e => e.currentTarget.select()} />
      <small>The system invitation carries this recipient-specific link. Keep it available only as an operator recovery copy. Verification is completed through the recipient's bound email address.</small>
    </div> : null}
    </div>
  </details>;
}
