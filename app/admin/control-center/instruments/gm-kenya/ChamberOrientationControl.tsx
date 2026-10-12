"use client";

import { useState } from "react";

import styles from "./page.module.css";

type Preview = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  attachment: {
    filename: string;
    status: string;
  };
};

export function ChamberOrientationControl() {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState<"preview" | "send" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function request(action: "preview" | "send") {
    const email = recipientEmail.trim();

    if (!email || busy) {
      return;
    }

    setBusy(action);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/instruments/gm-kenya/orientation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            recipientEmail: email,
            confirmation:
              action === "send" ? "SEND CHAMBER ORIENTATION" : undefined,
          }),
        },
      );

      const result = (await response.json()) as {
        ok?: boolean;
        from?: string;
        to?: string;
        subject?: string;
        text?: string;
        html?: string;
        attachment?: {
          filename?: string;
          status?: string;
        };
        error?: string;
        delivery?: {
          mode?: "send" | "log";
          alreadyDelivered?: boolean;
        };
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Chamber orientation failed");
      }

      if (action === "preview") {
        if (
          !result.from ||
          !result.to ||
          !result.subject ||
          !result.text ||
          !result.html ||
          !result.attachment?.filename ||
          !result.attachment.status
        ) {
          throw new Error("Orientation preview incomplete");
        }

        setPreview({
          from: result.from,
          to: result.to,
          subject: result.subject,
          text: result.text,
          html: result.html,
          attachment: {
            filename: result.attachment.filename,
            status: result.attachment.status,
          },
        });

        return;
      }

      setMessage(
        result.delivery?.mode === "send"
          ? result.delivery.alreadyDelivered
            ? "Orientation was already delivered. No duplicate email sent."
            : "Jacqueline orientation sent and recorded."
          : "Orientation recorded only. Outbound email mode is not enabled.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Chamber orientation failed",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <details className={styles.grantDisclosure}>
      <summary>
        <span>Prepare Jacqueline introduction</span>
        <small>INTRODUCTION + ORIENTATION</small>
      </summary>

      <div className={styles.grantControl}>
        <p>
          Introduces Jamal / French-Ward to Jacqueline Dyer at Friends of
          Farmers and attaches the Chamber Orientation. This communication
          contains no private Chamber credential and creates no V2 access grant.
        </p>

        <label
          style={{
            display: "grid",
            gap: ".35rem",
          }}
        >
          Jacqueline Dyer email
          <input
            type="email"
            autoComplete="off"
            value={recipientEmail}
            onChange={(event) => {
              setRecipientEmail(event.target.value);
              setPreview(null);
              setMessage("");
              setError("");
            }}
          />
        </label>

        <button
          type="button"
          disabled={!recipientEmail.trim() || Boolean(busy)}
          onClick={() => request("preview")}
        >
          {busy === "preview"
            ? "Preparing…"
            : "Preview introduction & orientation"}
        </button>

        {preview ? (
          <section
            aria-label="Jacqueline Chamber orientation review"
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
              <strong>Attachment:</strong> {preview.attachment.filename}
            </p>

            <iframe
              title="Jacqueline Chamber orientation email preview"
              srcDoc={preview.html}
              style={{
                width: "100%",
                minHeight: "760px",
                border: "1px solid rgba(154,181,198,.45)",
                background: "#f4f1ea",
              }}
            />

            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => request("send")}
              style={{
                marginTop: ".8rem",
              }}
            >
              {busy === "send"
                ? "Sending…"
                : "Approve & send orientation"}
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
