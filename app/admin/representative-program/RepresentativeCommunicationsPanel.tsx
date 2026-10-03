"use client";

import {
  useState,
} from "react";

type Communication = {
  id: number;
  type: string | null;
  from: string | null;
  to: string | null;
  subject: string | null;
  messageId: string | null;
  status: string | null;
  createdAt: string;
};

type Props = {
  intakeId: string;
  status: string;
  submittedAt: string | null;
  candidateEmail: string;
  communications: Communication[];
  onChanged?: () => void;
};

type CommunicationType =
  | "INVITATION"
  | "SUBMISSION_RECEIPT";

type Preview = {
  type: CommunicationType;
  to: string;
  subject: string;
  text: string;
  html: string;
};

export default function RepresentativeCommunicationsPanel({
  intakeId,
  status,
  submittedAt,
  candidateEmail,
  communications,
  onChanged,
}: Props) {
  const [preview, setPreview] =
    useState<Preview | null>(null);

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [notice, setNotice] =
    useState<string | null>(null);

  const [recoveryLink, setRecoveryLink] =
    useState<string | null>(null);

  const [accessDurationDays, setAccessDurationDays] =
    useState(7);

  const invitationEligible =
    status === "DRAFT" ||
    status === "RETURNED_FOR_COMPLETION";

  const receiptEligible =
    Boolean(submittedAt);

  async function previewCommunication(
    type: CommunicationType,
  ) {
    setBusy(true);
    setError(null);
    setNotice(null);
    setRecoveryLink(null);

    try {
      const response =
        await fetch(
          `/api/admin/representative-program/intakes/${encodeURIComponent(
            intakeId,
          )}/communications/preview`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            cache: "no-store",
            body: JSON.stringify({
              type,
            }),
          },
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.ok ||
        !result.html
      ) {
        throw new Error(
          result.error ??
            "Communication preview failed.",
        );
      }

      setPreview({
        type,
        to: result.to,
        subject: result.subject,
        text: result.text,
        html: result.html,
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Communication preview failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function approveAndSend() {
    if (!preview || busy) {
      return;
    }

    const label =
      preview.type === "INVITATION"
        ? "This will rotate the candidate's current private credential and send the new credential immediately. Continue?"
        : "Send this submission receipt to the candidate now?";

    if (!window.confirm(label)) {
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    setRecoveryLink(null);

    try {
      const response =
        await fetch(
          `/api/admin/representative-program/intakes/${encodeURIComponent(
            intakeId,
          )}/communications/send`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            cache: "no-store",
            body: JSON.stringify({
              type:
                preview.type,
              accessDurationDays,
            }),
          },
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.ok
      ) {
        if (
          result.recoveryAccessUrl
        ) {
          setRecoveryLink(
            result.recoveryAccessUrl,
          );
        }

        throw new Error(
          result.error ??
            "Communication send failed.",
        );
      }

      const mode =
        result.delivery?.mode;

      setNotice(
        mode === "send"
          ? preview.type === "INVITATION"
            ? "Official representative invitation sent. The prior candidate credential is now superseded."
            : "Submission receipt sent."
          : preview.type === "INVITATION"
            ? "Invitation recorded in log mode. A new private credential was issued, but outbound email was not sent."
            : "Submission receipt recorded in log mode.",
      );

      setPreview(null);

      onChanged?.();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Communication send failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded border border-cyan-500/20 bg-cyan-500/[0.035] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">
        Communications
      </p>

      <h3 className="mt-2 text-sm font-semibold text-gray-100">
        Representative Correspondence
      </h3>

      <p className="mt-2 text-xs leading-5 text-gray-400">
        Preview the exact institutional communication before delivery.
        Previewing never rotates access or sends email.
      </p>

      <div className="mt-4 grid gap-3">
        <div className="rounded border border-gray-800 bg-black p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
            Candidate Invitation
          </p>

          <p className="mt-2 text-xs text-gray-400">
            To {candidateEmail}
          </p>

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="grid gap-1">
              <span className="text-[10px] uppercase tracking-[0.14em] text-gray-600">
                Access Window
              </span>

              <select
                value={accessDurationDays}
                disabled={!invitationEligible || busy}
                onChange={(event) =>
                  setAccessDurationDays(
                    Number(event.target.value),
                  )
                }
                className="rounded border border-gray-700 bg-gray-950 px-2 py-1.5 text-xs text-white"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </label>

            <button
              type="button"
              disabled={
                !invitationEligible ||
                busy
              }
              onClick={() =>
                void previewCommunication(
                  "INVITATION",
                )
              }
              className="rounded border border-cyan-700 bg-cyan-950/30 px-3 py-1.5 text-xs font-semibold text-cyan-200 disabled:opacity-40"
            >
              Preview Invitation
            </button>
          </div>

          {!invitationEligible ? (
            <p className="mt-2 text-[11px] leading-5 text-gray-600">
              Invitation delivery is available only while the intake is DRAFT or returned for completion.
            </p>
          ) : null}
        </div>

        <div className="rounded border border-gray-800 bg-black p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
            Submission Receipt
          </p>

          <p className="mt-2 text-xs text-gray-400">
            Candidate-specific acknowledgement and continuity message.
          </p>

          <button
            type="button"
            disabled={
              !receiptEligible ||
              busy
            }
            onClick={() =>
              void previewCommunication(
                "SUBMISSION_RECEIPT",
              )
            }
            className="mt-3 rounded border border-cyan-700 bg-cyan-950/30 px-3 py-1.5 text-xs font-semibold text-cyan-200 disabled:opacity-40"
          >
            Preview Receipt
          </button>

          {!receiptEligible ? (
            <p className="mt-2 text-[11px] leading-5 text-gray-600">
              Receipt becomes available after candidate submission.
            </p>
          ) : null}
        </div>
      </div>

      {preview ? (
        <section className="mt-4 rounded border border-gray-700 bg-black p-3">
          <div className="grid gap-1 text-xs text-gray-400">
            <p>
              <span className="text-gray-600">
                Type:
              </span>{" "}
              {preview.type}
            </p>

            <p>
              <span className="text-gray-600">
                To:
              </span>{" "}
              {preview.to}
            </p>

            <p>
              <span className="text-gray-600">
                Subject:
              </span>{" "}
              {preview.subject}
            </p>
          </div>

          <div className="mt-4 overflow-hidden border border-gray-700 bg-white">
            <iframe
              title={`${preview.type} email preview`}
              srcDoc={preview.html}
              sandbox=""
              className="h-[720px] w-full bg-white"
            />
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void approveAndSend()
            }
            className="mt-4 rounded border border-emerald-600/50 bg-emerald-950/30 px-4 py-2 text-xs font-semibold text-emerald-200 disabled:opacity-50"
          >
            {busy
              ? "Sending…"
              : preview.type ===
                  "INVITATION"
                ? "Approve & Send Invitation"
                : "Approve & Send Receipt"}
          </button>
        </section>
      ) : null}

      {notice ? (
        <p
          role="status"
          className="mt-3 text-xs leading-5 text-emerald-300"
        >
          {notice}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-3 text-xs leading-5 text-red-300"
        >
          {error}
        </p>
      ) : null}

      {recoveryLink ? (
        <div className="mt-3 rounded border border-amber-500/30 bg-amber-500/5 p-3">
          <p className="text-xs font-semibold text-amber-200">
            Delivery failed after credential rotation.
          </p>

          <p className="mt-2 text-[11px] leading-5 text-amber-100/70">
            This recovery credential is shown only because delivery failed. Copy it securely or issue a new invitation.
          </p>

          <input
            readOnly
            value={recoveryLink}
            onFocus={(event) =>
              event.currentTarget.select()
            }
            className="mt-2 w-full rounded border border-gray-700 bg-black px-2 py-2 font-mono text-[10px] text-gray-300"
          />
        </div>
      ) : null}

      <details className="mt-4 border-t border-gray-800 pt-3">
        <summary className="cursor-pointer text-xs font-semibold text-gray-400">
          Communication History
        </summary>

        {communications.length ? (
          <ul className="mt-3 space-y-2">
            {communications.map(
              (communication) => (
                <li
                  key={communication.id}
                  className="rounded border border-gray-800 bg-black p-3"
                >
                  <p className="text-[10px] uppercase tracking-[0.13em] text-gray-500">
                    {communication.status ??
                      "UNKNOWN"}
                  </p>

                  <p className="mt-1 break-words text-xs text-gray-300">
                    {communication.subject ??
                      communication.type ??
                      "Representative communication"}
                  </p>

                  <p className="mt-1 text-[10px] text-gray-600">
                    {new Date(
                      communication.createdAt,
                    ).toLocaleString()}
                    {communication.messageId
                      ? ` · ${communication.messageId}`
                      : ""}
                  </p>
                </li>
              ),
            )}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-gray-600">
            No representative communications recorded yet.
          </p>
        )}
      </details>
    </section>
  );
}
