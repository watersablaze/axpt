"use client";

import { useState } from "react";

type Preview = {
  deliveryMode: "send" | "log";
  communicationKey: string;
  communicationType: string;
  from: string;
  to: string;
  cc: readonly string[];
  subject: string;
  heading: string;
  englishLines: readonly string[];
  koreanLines: readonly string[];
  html: string;
};

export function DonginEscrowResponseControl() {
  const [preview, setPreview] =
    useState<Preview | null>(null);

  const [busy, setBusy] =
    useState<"preview" | "send" | null>(
      null,
    );

  const [message, setMessage] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  async function request(
    action: "preview" | "send",
  ) {
    if (busy) {
      return;
    }

    if (action === "send") {
      if (!preview) {
        return;
      }

      const confirmed =
        window.confirm(
          [
            "Send the DONGIN escrow response now?",
            "",
            `To: ${preview.to}`,
            `Cc: ${preview.cc.join(", ")}`,
            "",
            `Subject: ${preview.subject}`,
            "",
            "One bilingual English + Korean institutional email will be delivered.",
            "No settlement state, document state, or transfer authority will change.",
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
      const response =
        await fetch(
          "/api/admin/communications/dongin-escrow-response",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              action,
            }),
          },
        );

      const payload =
        await response.json();

      if (
        !response.ok ||
        !payload.ok
      ) {
        throw new Error(
          payload.detail ??
            payload.error ??
            "DONGIN_ESCROW_RESPONSE_FAILED",
        );
      }

      if (action === "preview") {
        setPreview(
          payload.result as Preview,
        );
        return;
      }

      const delivery =
        payload.result?.delivery;

      setMessage(
        delivery?.alreadyDelivered
          ? "This DONGIN correspondence was already delivered."
          : "DONGIN escrow response sent successfully.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "DONGIN_ESCROW_RESPONSE_FAILED",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-lg border border-amber-900/50 bg-amber-950/10 p-4">
      <p className="text-[10px] uppercase tracking-[0.16em] text-amber-400">
        DONGIN Transaction Correspondence
      </p>

      <h3 className="mt-1 text-sm text-white">
        Escrow Structure & Transaction Activation
      </h3>

      <p className="mt-2 max-w-3xl text-xs leading-5 text-stone-400">
        Governed bilingual response to the Buyer
        and transaction representatives. English
        and Korean are delivered together as one
        institutional correspondence record.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            request("preview")
          }
          disabled={Boolean(busy)}
          className="rounded border border-stone-700 px-3 py-2 text-[10px] uppercase tracking-wide text-stone-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === "preview"
            ? "Preparing Preview..."
            : "Preview DONGIN Email"}
        </button>

        <button
          type="button"
          onClick={() =>
            request("send")
          }
          disabled={
            !preview ||
            preview.deliveryMode !== "send" ||
            Boolean(busy)
          }
          className="rounded border border-amber-800 px-3 py-2 text-[10px] uppercase tracking-wide text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === "send"
            ? "Sending..."
            : "Send DONGIN Email"}
        </button>

        {preview ? (
          <span
            className={
              preview.deliveryMode === "send"
                ? "self-center text-[9px] uppercase tracking-wide text-cyan-300"
                : "self-center text-[9px] uppercase tracking-wide text-stone-500"
            }
          >
            {preview.deliveryMode === "send"
              ? "Live send enabled"
              : "Log mode only"}
          </span>
        ) : null}
      </div>

      {preview ? (
        <div className="mt-4 space-y-4">
          <article className="rounded border border-stone-800 bg-black/25 p-4">
            <div className="grid gap-2 text-xs text-stone-400">
              <div>
                <span className="text-stone-600">
                  From:{" "}
                </span>
                <span className="text-white">
                  {preview.from}
                </span>
              </div>

              <div>
                <span className="text-stone-600">
                  To:{" "}
                </span>
                <span className="text-white">
                  {preview.to}
                </span>
              </div>

              <div>
                <span className="text-stone-600">
                  Cc:{" "}
                </span>
                <span className="text-white">
                  {preview.cc.join(", ")}
                </span>
              </div>

              <div>
                <span className="text-stone-600">
                  Subject:{" "}
                </span>
                <span className="text-white">
                  {preview.subject}
                </span>
              </div>

              <div>
                <span className="text-stone-600">
                  Communication:{" "}
                </span>
                <span className="font-mono text-amber-300">
                  {preview.communicationKey}
                </span>
              </div>
            </div>
          </article>

          <section className="overflow-hidden rounded border border-stone-800 bg-black/25">
            <div className="border-b border-stone-800 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-stone-500">
                Rendered Delivery Preview
              </p>

              <p className="mt-1 text-xs text-stone-400">
                Exact bilingual HTML generated
                by the governed send path.
              </p>
            </div>

            <div className="bg-[#07110d] p-2 sm:p-4">
              <iframe
                title="Rendered DONGIN escrow response email"
                srcDoc={preview.html}
                sandbox=""
                className="h-[1100px] w-full rounded border-0 bg-[#07110d]"
              />
            </div>
          </section>
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
