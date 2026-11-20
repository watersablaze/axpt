"use client";

import { useState } from "react";

type Props = {
  reference: string;
};

export function BuyerAccessReissueControl({
  reference,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [accessUrl, setAccessUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reissue() {
    if (busy) {
      return;
    }

    const confirmed = window.confirm(
      [
        "Reissue Corey Keller's private Buyer access?",
        "",
        "This will revoke the current Buyer VIEW grant and create one replacement V2-bound grant.",
        "It will not change settlement state, pricing, verification, or TAP authority.",
      ].join("\n"),
    );

    if (!confirmed) {
      return;
    }

    setBusy(true);
    setError(null);
    setAccessUrl(null);

    try {
      const response = await fetch(
        `/api/admin/instruments/digital-settlement/${encodeURIComponent(reference)}/reissue-buyer-access`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.detail ??
            payload.error ??
            "DSI_BUYER_ACCESS_REISSUE_FAILED",
        );
      }

      setAccessUrl(payload.result.accessUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "DSI_BUYER_ACCESS_REISSUE_FAILED",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-stone-800 bg-black/20 p-4">
      <p className="text-[10px] uppercase tracking-[0.16em] text-stone-500">
        Buyer private access
      </p>
      <h3 className="mt-1 text-sm text-white">
        Corey Keller · V2 Review Access
      </h3>
      <p className="mt-2 max-w-3xl text-xs leading-5 text-stone-500">
        Reissue only when the current bearer link is unavailable. The current
        Buyer grant is revoked atomically and replaced with one seven-day VIEW
        grant bound to the current DSI version.
      </p>

      <button
        type="button"
        onClick={reissue}
        disabled={busy}
        className="mt-3 rounded border border-amber-800 px-3 py-2 text-[10px] uppercase tracking-wide text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "Reissuing..." : "Reissue Buyer Access"}
      </button>

      {accessUrl ? (
        <div className="mt-4 rounded border border-cyan-900/60 bg-cyan-950/10 p-3">
          <p className="text-[10px] uppercase tracking-wide text-cyan-300">
            Replacement private link · shown once
          </p>
          <a
            href={accessUrl}
            className="mt-2 block break-all font-mono text-xs text-white underline underline-offset-4"
          >
            {accessUrl}
          </a>
          <p className="mt-2 text-[11px] leading-5 text-stone-500">
            Open this link in the Buyer browser session. It exchanges the bearer
            token for the protected access cookie and redirects into the
            transaction console.
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-xs text-rose-300">{error}</p>
      ) : null}
    </div>
  );
}
