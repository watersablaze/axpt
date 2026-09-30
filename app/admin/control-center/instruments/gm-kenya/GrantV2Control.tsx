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
  async function grant() {
    if (busy || !email || !name || !institution || !capacity) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/instruments/gm-kenya/grant-v2", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId, email, name, institution, capacity }),
      });
      const result = await response.json() as { ok?: boolean; privatePath?: string; error?: string };
      if (!response.ok || !result.ok || !result.privatePath)
        throw new Error(result.error ?? "Grant failed");
      setLink(`${window.location.origin}${result.privatePath}`);
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Grant failed"); }
    finally { setBusy(false); }
  }
  return <details className={styles.grantDisclosure}>
    <summary>Create recipient access</summary>
    <div className={styles.grantControl}>
    <p>Create named recipient access to V3. AXPT creates an identity when needed. Verify the email, institution, and capacity before creating the private link.</p>
    <div className={styles.grantFields}>
      <label>Email<input type="email" value={email} autoComplete="off" onChange={e => setEmail(e.target.value)} /></label>
      <label>Name<input value={name} onChange={e => setName(e.target.value)} /></label>
      <label>Represented institution<input value={institution} onChange={e => setInstitution(e.target.value)} /></label>
      <label>Representative capacity<input value={capacity} onChange={e => setCapacity(e.target.value)} /></label>
    </div>
    <button type="button" disabled={busy || !email || !name || !institution || !capacity || Boolean(link)} onClick={grant}>
      {busy ? "Creating…" : "Create V3 access"}
    </button>
    {error ? <p role="alert">{error}</p> : null}
    {link ? <div className={styles.privateLink} role="status">
      <strong>Access created · copy this link now</strong>
      <input readOnly value={link} aria-label="Private V3 access link" onFocus={e => e.currentTarget.select()} />
      <small>Copy and share this link with the named recipient. They request an email verification code when opening it. Creating access does not send an invitation.</small>
    </div> : null}
    </div>
  </details>;
}
