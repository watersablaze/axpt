"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RevokeV2Control({ grantId }: { grantId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function revoke() {
    if (busy || !window.confirm("Revoke this recipient's V2 access? Their recorded response will remain.")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/instruments/gm-kenya/revoke-v2", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grantId, confirmation: "REVOKE V2 ACCESS" }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Revocation failed");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Revocation failed"); }
    finally { setBusy(false); }
  }
  return <div>
    <button type="button" disabled={busy} onClick={revoke}>{busy ? "Revoking…" : "Revoke access"}</button>
    {error ? <p role="alert">{error}</p> : null}
  </div>;
}
