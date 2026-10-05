"use client";

import { useState } from "react";

import styles from "./page.module.css";

type Preview = {
  from: string;
  to: string;
  cc: string | null;
  subject: string;
  text: string;
  html: string;
};

export function ChamberReminderControl({ grantId }: { grantId: string }) {
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
      const response = await fetch("/api/admin/instruments/gm-kenya/reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          grantId,
          accessUrl: privateUrl,
          confirmation: action === "send" ? "SEND CHAMBER REMINDER" : undefined,
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        from?: string;
        to?: string;
        cc?: string | null;
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
        throw new Error(result.error ?? "Chamber reminder failed");
      }

      if (action === "preview") {
        if (
          !result.from ||
          !result.to ||
          !result.subject ||
          !result.text ||
          !result.html
        ) {
          throw new Error("Reminder preview incomplete");
        }

        setPreview({
          from: result.from,
          to: result.to,
          cc: result.cc ?? null,
          subject: result.subject,
          text: result.text,
          html: result.html,
        });

        return;
      }

      setMessage(
        result.delivery?.mode === "send"
          ? result.delivery.alreadyDelivered
            ? "Reminder was already delivered. No duplicate email sent."
            : "Chamber reminder sent and recorded."
          : "Reminder recorded only. Outbound email mode is not enabled.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Chamber reminder failed",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <details className={styles.grantDisclosure}>
      <summary>Prepare deliberation reminder</summary>

      <div className={styles.grantControl}>
        <p>
          Reuse this recipient&apos;s existing private Chamber credential. No
          new access grant is created.
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
          {busy === "preview" ? "Preparing…" : "Preview deliberation reminder"}
        </button>

        {preview ? (
          <section
            aria-label="Chamber deliberation reminder review"
            style={{
              marginTop: ".7rem",
              border: "1px solid rgba(203,180,128,.42)",
              padding: ".8rem",
              background: "rgba(5,17,26,.42)",
            }}
          >
            <p>
              <strong>From:</strong> {preview.from}
            </p>

            <p>
              <strong>To:</strong> {preview.to}
            </p>

            {preview.cc ? (
              <p>
                <strong>Cc:</strong> {preview.cc}
              </p>
            ) : null}

            <p>
              <strong>Subject:</strong> {preview.subject}
            </p>

            <iframe
              title="Chamber deliberation reminder preview"
              srcDoc={preview.html}
              style={{
                width: "100%",
                minHeight: "650px",
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
              {busy === "send"
                ? "Sending…"
                : "Approve & send deliberation reminder"}
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
