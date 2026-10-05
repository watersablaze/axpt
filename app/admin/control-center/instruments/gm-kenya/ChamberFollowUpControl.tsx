"use client";

import { useState } from "react";

import styles from "./page.module.css";

type Preview = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export function ChamberFollowUpControl({ grantId }: { grantId: string }) {
  const [accessUrl, setAccessUrl] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState<"preview" | "send" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function request(action: "preview" | "send") {
    const privateUrl = accessUrl.trim();

    if (!privateUrl || busy) {
      return;
    }

    setBusy(action);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/instruments/gm-kenya/follow-up",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            grantId,
            accessUrl: privateUrl,
            confirmation:
              action === "send" ? "SEND CHAMBER FOLLOW-UP" : undefined,
          }),
        },
      );

      const result = (await response.json()) as {
        ok?: boolean;
        to?: string;
        subject?: string;
        text?: string;
        html?: string;
        error?: string;
        delivery?: {
          mode?: "send" | "log";
          alreadyDelivered?: boolean;
        };
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Chamber follow-up failed");
      }

      if (action === "preview") {
        if (!result.to || !result.subject || !result.text || !result.html) {
          throw new Error("Follow-up preview incomplete");
        }

        setPreview({
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
            ? "Follow-up was already delivered. No duplicate email sent."
            : "Chamber follow-up sent and recorded."
          : "Follow-up recorded only. Outbound email mode is not enabled.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Chamber follow-up failed",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <details className={styles.grantDisclosure}>
      <summary>Prepare response follow-up</summary>

      <div className={styles.grantControl}>
        <p>
          Reuse the recipient&apos;s existing private Chamber credential. The
          credential is validated against this active grant and is not stored in
          EmailLog metadata.
        </p>

        <label
          style={{
            display: "grid",
            gap: ".35rem",
          }}
        >
          Existing private Chamber link
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={accessUrl}
            onChange={(event) => {
              setAccessUrl(event.target.value);
              setPreview(null);
              setMessage("");
              setError("");
            }}
          />
        </label>

        <button
          type="button"
          disabled={!accessUrl.trim() || Boolean(busy)}
          onClick={() => request("preview")}
        >
          {busy === "preview" ? "Preparing…" : "Preview response follow-up"}
        </button>

        {preview ? (
          <section
            aria-label="Chamber response follow-up review"
            style={{
              marginTop: ".7rem",
              border: "1px solid rgba(203,180,128,.42)",
              padding: ".8rem",
              background: "rgba(5,17,26,.42)",
            }}
          >
            <p>
              <strong>To:</strong> {preview.to}
            </p>

            <p>
              <strong>Subject:</strong> {preview.subject}
            </p>

            <iframe
              title="Chamber follow-up preview"
              srcDoc={preview.html}
              style={{
                width: "100%",
                minHeight: "760px",
                border: "1px solid rgba(154,181,198,.45)",
                background: "#0a1926",
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
              {busy === "send" ? "Sending…" : "Approve & send response follow-up"}
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
