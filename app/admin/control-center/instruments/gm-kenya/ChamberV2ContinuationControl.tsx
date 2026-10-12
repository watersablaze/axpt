"use client";

import { useState } from "react";

import styles from "./page.module.css";

type Preview = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

export function ChamberV2ContinuationControl({
  grantId,
}: {
  grantId: string;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState<"preview" | "attachment" | "send" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function request(action: "preview" | "attachment" | "send") {
    if (busy) return;

    if (action === "attachment" && !preview?.to) {
      setError("Preview the continuation email before opening the attachment.");
      return;
    }

    setBusy(action);
    setError("");
    setMessage("");

    const attachmentWindow =
      action === "attachment" ? window.open("", "_blank") : null;

    if (action === "attachment" && !attachmentWindow) {
      setBusy(null);
      setError(
        "The browser blocked the attachment preview window. Allow pop-ups for localhost:3010 and try again.",
      );
      return;
    }

    try {
      const response = await fetch(
        "/api/admin/instruments/gm-kenya/v2-continuation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            grantId,
            confirmation:
              action === "send"
                ? "SEND CHAMBER V2 CONTINUATION"
                : undefined,
          }),
        },
      );

      if (action === "attachment") {
        if (!response.ok) {
          const result = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(result?.error ?? "Orientation attachment failed");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        if (attachmentWindow) {
          attachmentWindow.location.href = url;
          attachmentWindow.opener = null;
        }

        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        return;
      }

      const result = (await response.json()) as {
        ok?: boolean;
        from?: string;
        to?: string;
        subject?: string;
        text?: string;
        html?: string;
        error?: string;
        attachment?: {
          filename?: string;
          status?: string;
        };
        delivery?: {
          mode?: "send" | "log";
          alreadyDelivered?: boolean;
        };
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Chamber V2 continuation failed");
      }

      if (action === "preview") {
        if (
          !result.from ||
          !result.to ||
          !result.subject ||
          !result.text ||
          !result.html
        ) {
          throw new Error("Continuation preview incomplete");
        }

        setPreview({
          from: result.from,
          to: result.to,
          subject: result.subject,
          text: result.text,
          html: result.html,
        });

        return;
      }

      setMessage(
        result.delivery?.mode === "send"
          ? result.delivery.alreadyDelivered
            ? "Continuation email was already delivered. No duplicate email sent."
            : "Chamber V2 continuation sent and recorded."
          : "Continuation recorded only. Outbound email mode is not enabled.",
      );
    } catch (cause) {
      if (attachmentWindow && !attachmentWindow.closed) {
        attachmentWindow.close();
      }

      setError(
        cause instanceof Error
          ? cause.message
          : "Chamber V2 continuation failed",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <details className={styles.grantDisclosure}>
      <summary>
        <span>Prepare Chamber V2 continuation</span>
        <small>KHAN-KHAN · PRE-V2 COMMUNICATION</small>
      </summary>

      <div className={styles.grantControl}>
        <p>
          Concludes Chamber V1, addresses the submitted rebuttal posture and
          refinery sequencing, records the unanswered follow-up questions, and
          forecasts refreshed Chamber V2 access within 48 hours, and attaches
          a tailored Chamber V2 Orientation for Khan-Khan. No private credential
          is included.
        </p>

        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => request("preview")}
        >
          {busy === "preview"
            ? "Preparing…"
            : "Preview Chamber V2 continuation"}
        </button>

        {preview ? (
          <section
            aria-label="Khan-Khan Chamber V2 continuation review"
            style={{
              marginTop: ".8rem",
              border: "1px solid rgba(203,180,128,.42)",
              padding: ".9rem",
              background: "rgba(5,17,26,.42)",
            }}
          >
            <p>
              <strong>From:</strong> {preview.from}
            </p>
            <p>
              <strong>To:</strong> {preview.to}
            </p>
            <p>
              <strong>Subject:</strong> {preview.subject}
            </p>

            <p>
              <strong>Attachment:</strong>{" "}
              Chamber-V2-Orientation-Khan-Khan-GM-KENYA-RCF-001.pdf
            </p>

            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => request("attachment")}
            >
              {busy === "attachment"
                ? "Opening attachment…"
                : "Preview attachment"}
            </button>

            <iframe
              title="Khan-Khan Chamber V2 continuation email preview"
              srcDoc={preview.html}
              style={{
                width: "100%",
                minHeight: "900px",
                border: "1px solid rgba(154,181,198,.45)",
                background: "#f5f1e8",
              }}
            />

            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => request("send")}
              style={{ marginTop: ".8rem" }}
            >
              {busy === "send"
                ? "Sending…"
                : "Approve & send Chamber V2 continuation"}
            </button>
          </section>
        ) : null}

        {error ? <p role="alert">{error}</p> : null}

        {message ? (
          <p className={styles.deliveryNotice} role="status">
            {message}
          </p>
        ) : null}
      </div>
    </details>
  );
}
