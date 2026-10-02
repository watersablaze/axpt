"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import styles from "./page.module.css";

type Preview = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export function GrantV2Control({ versionId }: { versionId: string }) {
  const router = useRouter();

  const [email, setEmail] = useState("");

  const [name, setName] = useState("");

  const [institution, setInstitution] = useState("");

  const [capacity, setCapacity] = useState("");

  const [preview, setPreview] = useState<Preview | null>(null);

  const [lastLink, setLastLink] = useState("");

  const [delivery, setDelivery] = useState("");

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");

  function invalidatePreview() {
    setPreview(null);
    setError("");
  }

  async function previewInvitation() {
    if (busy || !email || !name || !institution || !capacity) {
      return;
    }

    setBusy(true);
    setError("");
    setDelivery("");

    try {
      const response = await fetch(
        "/api/admin/instruments/gm-kenya/invitation-preview",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            name,
            institution,
            capacity,
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
      };

      if (
        !response.ok ||
        !result.ok ||
        !result.to ||
        !result.subject ||
        !result.text ||
        !result.html
      ) {
        throw new Error(result.error ?? "Invitation preview failed");
      }

      setPreview({
        to: result.to,
        subject: result.subject,
        text: result.text,
        html: result.html,
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Invitation preview failed",
      );
    } finally {
      setBusy(false);
    }
  }

  async function approveAndSend() {
    if (busy || !preview) {
      return;
    }

    setBusy(true);
    setError("");
    setDelivery("");

    try {
      const response = await fetch("/api/admin/instruments/gm-kenya/grant-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          versionId,
          email,
          name,
          institution,
          capacity,
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        privatePath?: string;
        error?: string;
        invitation?: {
          ok?: boolean;
          mode?: "send" | "log";
          error?: string;
        };
      };

      if (!response.ok || !result.ok || !result.privatePath) {
        throw new Error(result.error ?? "Grant failed");
      }

      setLastLink(`${window.location.origin}${result.privatePath}`);

      if (result.invitation?.ok) {
        setDelivery(
          result.invitation.mode === "send"
            ? "Access created · official invitation sent. Form ready for the next recipient."
            : "Access created · invitation logged only. Outbound email mode is not enabled in this environment.",
        );
      } else {
        setDelivery(
          "Access created, but the invitation email was not delivered. Use the recovery credential below or send a fresh invitation from the recipient record.",
        );
      }

      /*
       * Prepare immediately for the next recipient.
       * router.refresh() refreshes server data in-place;
       * it is not a browser/page reload.
       */
      setEmail("");
      setName("");
      setInstitution("");
      setCapacity("");
      setPreview(null);

      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Grant failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className={styles.grantDisclosure} open>
      <summary>Create recipient access</summary>

      <div className={styles.grantControl}>
        <p>
          Enter the recipient identity, review the institutional invitation,
          then approve creation and delivery.
        </p>

        <div className={styles.grantFields}>
          <label>
            Email
            <input
              type="email"
              value={email}
              autoComplete="off"
              onChange={(event) => {
                setEmail(event.target.value);
                invalidatePreview();
              }}
            />
          </label>

          <label>
            Name
            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                invalidatePreview();
              }}
            />
          </label>

          <label>
            Represented institution
            <input
              value={institution}
              onChange={(event) => {
                setInstitution(event.target.value);
                invalidatePreview();
              }}
            />
          </label>

          <label>
            Representative capacity
            <input
              value={capacity}
              onChange={(event) => {
                setCapacity(event.target.value);
                invalidatePreview();
              }}
            />
          </label>
        </div>

        <button
          type="button"
          disabled={busy || !email || !name || !institution || !capacity}
          onClick={previewInvitation}
        >
          {busy && !preview ? "Preparing…" : "Preview invitation"}
        </button>

        {preview ? (
          <section
            aria-label="Invitation review"
            style={{
              marginTop: "1.4rem",
              border: "1px solid rgba(203, 180, 128, .42)",
              padding: "1rem",
              background: "rgba(5, 17, 26, .42)",
            }}
          >
            <p
              style={{
                margin: "0 0 .35rem",
              }}
            >
              <strong>To:</strong> {preview.to}
            </p>

            <p
              style={{
                margin: "0 0 1rem",
              }}
            >
              <strong>Subject:</strong> {preview.subject}
            </p>

            <iframe
              title="Global Mother invitation preview"
              srcDoc={preview.html}
              style={{
                width: "100%",
                minHeight: "720px",
                border: "1px solid rgba(154, 181, 198, .45)",
                background: "#0a1926",
              }}
            />

            <div
              style={{
                marginTop: "1rem",
              }}
            >
              <button type="button" disabled={busy} onClick={approveAndSend}>
                {busy
                  ? "Creating & sending…"
                  : "Approve & send official invitation"}
              </button>
            </div>
          </section>
        ) : null}

        {error ? <p role="alert">{error}</p> : null}

        {delivery ? (
          <p className={styles.deliveryNotice} role="status">
            {delivery}
          </p>
        ) : null}

        {lastLink ? (
          <div className={styles.privateLink} role="status">
            <strong>Latest private access credential</strong>

            <input
              readOnly
              value={lastLink}
              aria-label="Latest private Framework access link"
              onFocus={(event) => event.currentTarget.select()}
            />

            <small>
              Operator recovery copy. The official invitation carries the
              recipient-specific credential.
            </small>
          </div>
        ) : null}
      </div>
    </details>
  );
}
