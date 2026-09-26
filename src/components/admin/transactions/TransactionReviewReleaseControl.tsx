"use client";

import { useState } from "react";

type Preview = {
  deliveryMode: "send" | "log";
  releaseKey: string;
  buyer: {
    to: string;
    subject: string;
    heading: string;
    authority: string;
    lines: readonly string[];
  };
  internal: {
    to: readonly string[];
    subject: string;
    heading: string;
    authority: string;
    lines: readonly string[];
  };
  documents: {
    spa: {
      version: number;
      sha256: string;
    };
    commercialSchedule: {
      version: number;
      sha256: string;
    };
  };
};

type Props = {
  reference: string;
};

export function TransactionReviewReleaseControl({
  reference,
}: Props) {
  const [accessUrl, setAccessUrl] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState<"preview" | "send" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function request(
    action: "preview" | "send",
  ) {
    const privateUrl = accessUrl.trim();

    if (!privateUrl || busy) {
      return;
    }

    if (action === "send") {
      const confirmed = window.confirm(
        [
          "Send the counterparty review package now?",
          "",
          "Buyer: Corey Keller",
          "Internal: Bobby + Lawrence",
          "",
          "SPA + Commercial Schedule remain REVIEW COPY · NOT FOR EXECUTION.",
          "This does not change settlement state or TAP authority.",
        ].join("\n"),
      );

      if (!confirmed) {
        return;
      }
    }

    setBusy(action);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/admin/transactions/${encodeURIComponent(reference)}/review-release`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            accessUrl: privateUrl,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.detail ??
            payload.error ??
            "TRANSACTION_REVIEW_RELEASE_FAILED",
        );
      }

      if (action === "preview") {
        setPreview(payload.result as Preview);
        return;
      }

      const buyer =
        payload.result?.buyer;
      const internal =
        payload.result?.internal;

      setMessage(
        [
          buyer?.alreadyDelivered
            ? "Buyer review email was already delivered."
            : "Buyer review email sent.",
          internal?.alreadyDelivered
            ? "Internal review notice was already delivered."
            : "Internal review notice sent.",
        ].join(" "),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "TRANSACTION_REVIEW_RELEASE_FAILED",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-lg border border-amber-900/50 bg-amber-950/10 p-4">
      <p className="text-[10px] uppercase tracking-[0.16em] text-amber-400">
        Counterparty review release
      </p>
      <h3 className="mt-1 text-sm text-white">
        Send Buyer Review Package
      </h3>
      <p className="mt-2 max-w-3xl text-xs leading-5 text-stone-400">
        Validate the current Corey Keller private Buyer link, preview the
        transaction-level communication, then send the review release to the
        Buyer and the internal French-Ward recipients. No settlement authority
        changes.
      </p>

      <label className="mt-4 block text-[10px] uppercase tracking-wide text-stone-500">
        Current Buyer private access URL
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={accessUrl}
          onChange={(event) => {
            setAccessUrl(event.target.value);
            setPreview(null);
            setMessage(null);
            setError(null);
          }}
          placeholder="Paste the current private Buyer access URL"
          className="mt-2 w-full rounded border border-stone-700 bg-black px-3 py-2 font-mono text-xs normal-case tracking-normal text-white"
        />
      </label>

      <p className="mt-2 text-[11px] leading-5 text-stone-600">
        The bearer credential is used only to validate the active Buyer grant
        and build the communication. It is not written into EmailLog metadata.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => request("preview")}
          disabled={!accessUrl.trim() || Boolean(busy)}
          className="rounded border border-stone-700 px-3 py-2 text-[10px] uppercase tracking-wide text-stone-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === "preview"
            ? "Preparing Preview..."
            : "Preview Review Email"}
        </button>

        <button
          type="button"
          onClick={() => request("send")}
          disabled={
            !accessUrl.trim() ||
            !preview ||
            preview.deliveryMode !== "send" ||
            Boolean(busy)
          }
          className="rounded border border-amber-800 px-3 py-2 text-[10px] uppercase tracking-wide text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === "send"
            ? "Sending..."
            : "Send Buyer Review Package"}
        </button>
      </div>

      {preview ? (
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          <article className="rounded border border-stone-800 bg-black/25 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-wide text-stone-500">
                Buyer preview
              </p>
              <span className="text-[9px] uppercase tracking-wide text-cyan-300">
                {preview.deliveryMode === "send"
                  ? "Live send enabled"
                  : "Log mode only"}
              </span>
            </div>
            <p className="mt-2 text-xs text-stone-500">
              To: {preview.buyer.to}
            </p>
            <h4 className="mt-2 text-sm text-white">
              {preview.buyer.subject}
            </h4>
            <p className="mt-2 text-[10px] uppercase tracking-wide text-amber-300">
              {preview.buyer.authority}
            </p>
            <div className="mt-3 space-y-2 text-xs leading-5 text-stone-400">
              {preview.buyer.lines.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </article>

          <article className="rounded border border-stone-800 bg-black/25 p-4">
            <p className="text-[10px] uppercase tracking-wide text-stone-500">
              Internal preview
            </p>
            <p className="mt-2 break-all text-xs text-stone-500">
              To: {preview.internal.to.join(", ")}
            </p>
            <h4 className="mt-2 text-sm text-white">
              {preview.internal.subject}
            </h4>
            <p className="mt-2 text-[10px] uppercase tracking-wide text-amber-300">
              {preview.internal.authority}
            </p>
            <div className="mt-3 space-y-2 text-xs leading-5 text-stone-400">
              {preview.internal.lines.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </article>
        </div>
      ) : null}

      {message ? (
        <p className="mt-4 rounded border border-cyan-900/50 bg-cyan-950/10 p-3 text-xs text-cyan-200">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded border border-rose-900/50 bg-rose-950/10 p-3 text-xs text-rose-300">
          {error}
        </p>
      ) : null}
    </section>
  );
}
