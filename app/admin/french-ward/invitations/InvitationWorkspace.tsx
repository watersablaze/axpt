"use client";

import { useState } from "react";
import Link from "next/link";

type Capacity = "STRATEGIC" | "OPERATIONS" | "FIDUCIARY";

type RecordRow = {
  reference: string;
  recipientDisplayName: string;
  recipientEmail: string;
  participantReference: string;
  institutionalTitle: string;
  capacityClass: Capacity;
  issuedAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  deliveryStatus: string;
};

type InvitationDraft = {
  reference: string;
  recipientEmail: string;
  recipientDisplayName: string;
  participantReference: string;
  institutionalTitle: string;
  secondaryTitle: string;
  capacityClass: Capacity;
  recognitionBasis: string;
  provenanceReference: string;
  expiresAt: string;
};

const EMPTY: InvitationDraft = {
  reference: "",
  recipientEmail: "",
  recipientDisplayName: "",
  participantReference: "",
  institutionalTitle: "",
  secondaryTitle: "",
  capacityClass: "STRATEGIC",
  recognitionBasis: "",
  provenanceReference: "",
  expiresAt: "",
};

type DispatchResult = {
  ok?: boolean;
  error?: string;
  invitationIssued?: boolean;
  deliveryAccepted?: boolean;
  deliveryStatus?: string;
  reference?: string;
};

const fieldClass =
  "w-full rounded-md border border-neutral-600 bg-neutral-950 " +
  "px-3 py-2 text-sm text-neutral-100";

const labelClass = "block space-y-1 text-sm text-neutral-300";

function recordState(record: RecordRow) {
  if (record.revokedAt) return "REVOKED";
  if (record.acceptedAt) return "ACCEPTED";
  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    return "EXPIRED";
  }
  return "PENDING";
}

export default function InvitationWorkspace({
  issuerEligible,
  previewOnly,
  records,
}: {
  issuerEligible: boolean;
  previewOnly: boolean;
  records: RecordRow[];
}) {
  const [draft, setDraft] = useState<InvitationDraft>(EMPTY);
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locked, setLocked] = useState(false);
  const [outcome, setOutcome] = useState<DispatchResult | null>(null);
  const [message, setMessage] = useState("");
  const [deliveryKey, setDeliveryKey] = useState("");

  function update<K extends keyof InvitationDraft>(
    key: K,
    value: InvitationDraft[K]
  ) {
    if (locked || submitting) return;
    setDraft(previous => ({ ...previous, [key]: value }));
    setReviewing(false);
    setOutcome(null);
    setMessage("");
    setDeliveryKey("");
  }

  function prepareReview() {
    const required: (keyof InvitationDraft)[] = [
      "reference",
      "recipientEmail",
      "recipientDisplayName",
      "participantReference",
      "institutionalTitle",
      "recognitionBasis",
      "expiresAt",
    ];

    if (required.some(key => !draft[key].trim())) {
      setMessage("Complete every required field before review.");
      return;
    }

    const expiry = new Date(draft.expiresAt);
    const interval = expiry.getTime() - Date.now();

    if (
      !Number.isFinite(interval) ||
      interval <= 0 ||
      interval > 30 * 86400000
    ) {
      setMessage("Expiration must be within the next 30 days.");
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        draft.recipientEmail.trim()
      )
    ) {
      setMessage("Enter a valid recipient email address.");
      return;
    }

    if (!previewOnly && !deliveryKey) {
      setDeliveryKey(
        crypto.randomUUID().replace(/-/g, "")
      );
    }

    setMessage("");
    setReviewing(true);
  }

  async function authorizeIssuance() {
    if (
      previewOnly ||
      !reviewing ||
      !issuerEligible ||
      submitting ||
      locked ||
      !deliveryKey
    ) return;

    setSubmitting(true);
    setLocked(true);
    setMessage("Submitting the invitation for issuance and delivery.");

    try {
      const response = await fetch(
        "/api/admin/french-ward/institutional-invitations",
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            ...draft,
            reference: draft.reference.trim(),
            recipientEmail: draft.recipientEmail.trim().toLowerCase(),
            recipientDisplayName: draft.recipientDisplayName.trim(),
            participantReference: draft.participantReference.trim(),
            institutionalTitle: draft.institutionalTitle.trim(),
            secondaryTitle: draft.secondaryTitle.trim() || null,
            recognitionBasis: draft.recognitionBasis.trim(),
            provenanceReference:
              draft.provenanceReference.trim() || null,
            expiresAt: new Date(draft.expiresAt).toISOString(),
            deliveryKey,
          }),
        }
      );

      const result = (await response.json()) as DispatchResult;
      setOutcome(result);

      if (result.invitationIssued === true) {
        setMessage(
          result.deliveryAccepted
            ? "Invitation issued. Email provider accepted delivery."
            : "Invitation issued. Delivery is not confirmed. Reconcile before taking another action."
        );
      } else if (response.status === 400 || response.status === 403 ||
                 response.status === 401 || response.status === 503) {
        setMessage(result.error || "Issuance was not authorized.");
        setLocked(false);
        setReviewing(false);
      } else {
        setMessage(
          "Issuance outcome requires reconciliation. Do not resubmit."
        );
      }
    } catch {
      setMessage(
        "The request outcome is unknown. Do not resubmit or generate another invitation until the register is checked."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const fields: {
    key: keyof InvitationDraft;
    label: string;
    required?: boolean;
  }[] = [
    { key: "recipientDisplayName", label: "Recipient full name", required: true },
    { key: "recipientEmail", label: "Recipient email", required: true },
    { key: "reference", label: "Invitation reference", required: true },
    { key: "participantReference", label: "Participant reference", required: true },
    { key: "institutionalTitle", label: "Proposed institutional title", required: true },
    { key: "secondaryTitle", label: "Additional title" },
    { key: "recognitionBasis", label: "Recognition basis", required: true },
    { key: "provenanceReference", label: "Provenance reference" },
  ];

  return (
    <main className="min-h-screen bg-neutral-950 px-5 py-8 text-neutral-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-3">
          <Link href="/admin" className="text-sm underline">
            Administration
          </Link>
          <p className="text-xs uppercase tracking-widest text-neutral-400">
            French-Ward · Institutional administration
          </p>
          <h1 className="text-3xl">Institutional Invitations</h1>
          <p className="max-w-3xl text-sm leading-6 text-neutral-400">
            Prepare controlled invitations into French-Ward institutional
            participation. Issuance, provider delivery, acceptance,
            recognition, and authority remain distinct.
          </p>
        </header>

        {!issuerEligible && (
          <section role="alert" className="rounded-md border border-amber-700 p-4 text-sm">
            Your current account does not satisfy the domain issuer
            requirement. Invitation issuance is unavailable.
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5 rounded-lg border border-neutral-700 p-5">
            <h2 className="text-xl">Prepare an invitation</h2>

            <div className="grid gap-4">
              {fields.map(field => (
                <label key={field.key} className={labelClass}>
                  <span>
                    {field.label}
                    {field.required ? " *" : ""}
                  </span>
                  {field.key === "recognitionBasis" ? (
                    <textarea
                      className={fieldClass}
                      rows={4}
                      maxLength={3000}
                      disabled={locked || submitting}
                      value={draft.recognitionBasis}
                      onChange={event =>
                        update("recognitionBasis", event.target.value)
                      }
                    />
                  ) : (
                    <input
                      className={fieldClass}
                      maxLength={
                        field.key === "recipientEmail" ? 254 : 191
                      }
                      type={
                        field.key === "recipientEmail" ? "email" : "text"
                      }
                      disabled={locked || submitting}
                      value={draft[field.key]}
                      onChange={event =>
                        update(field.key, event.target.value)
                      }
                    />
                  )}
                </label>
              ))}

              <label className={labelClass}>
                <span>Capacity classification</span>
                <select
                  className={fieldClass}
                  disabled={locked || submitting}
                  value={draft.capacityClass}
                  onChange={event =>
                    update(
                      "capacityClass",
                      event.target.value as Capacity
                    )
                  }
                >
                  <option value="STRATEGIC">Strategic</option>
                  <option value="OPERATIONS">Operations</option>
                  <option value="FIDUCIARY">Fiduciary</option>
                </select>
              </label>

              <label className={labelClass}>
                <span>Invitation expiration</span>
                <input
                  className={fieldClass}
                  type="datetime-local"
                  disabled={locked || submitting}
                  value={draft.expiresAt}
                  onChange={event =>
                    update("expiresAt", event.target.value)
                  }
                />
              </label>
            </div>

            <button
              type="button"
              onClick={prepareReview}
              disabled={locked || submitting || (!previewOnly && !issuerEligible)}
              className="rounded-md border border-neutral-500 px-4 py-2 text-sm disabled:opacity-40"
            >
              Review invitation
            </button>
          </div>

          <div className="space-y-5">
            <section className="space-y-4 rounded-lg border border-neutral-700 p-5">
              <h2 className="text-xl">Review and authorization</h2>

              {!reviewing ? (
                <p className="text-sm text-neutral-400">
                  Complete the invitation particulars to review the
                  recipient and proposed capacity before issuance.
                </p>
              ) : (
                <div className="space-y-3 text-sm">
                  <p><strong>Recipient:</strong> {draft.recipientDisplayName.trim()}</p>
                  <p><strong>Email:</strong> {draft.recipientEmail.trim().toLowerCase()}</p>
                  <p><strong>Invitation:</strong> {draft.reference.trim()}</p>
                  <p><strong>Participant:</strong> {draft.participantReference.trim()}</p>
                  <p><strong>Title:</strong> {draft.institutionalTitle.trim()}</p>
                  <p><strong>Secondary title:</strong> {draft.secondaryTitle.trim() || "Not provided"}</p>
                  <p><strong>Capacity:</strong> {draft.capacityClass}</p>
                  <p><strong>Recognition basis:</strong> {draft.recognitionBasis.trim()}</p>
                  <p><strong>Provenance reference:</strong> {draft.provenanceReference.trim() || "Not provided"}</p>
                  <p><strong>Expiration (UTC):</strong> {new Date(draft.expiresAt).toISOString()}</p>

                  <p className="border-t border-neutral-700 pt-3 text-neutral-400">
                    {previewOnly
                      ? "Preview only. You can review the invitation particulars here. Issuance and email delivery are disabled."
                      : "Authorization requests credential issuance and email dispatch. It does not appoint the recipient or grant institutional permissions."}
                  </p>

                  <button
                    type="button"
                    disabled={previewOnly || submitting || locked || !issuerEligible}
                    onClick={authorizeIssuance}
                    className="rounded-md bg-neutral-100 px-4 py-3 font-medium text-neutral-950 disabled:opacity-40"
                  >
                    {previewOnly
                      ? "Issuance disabled in preview"
                      : submitting
                        ? "Submitting..."
                      : "Authorize issuance and delivery"}
                  </button>
                </div>
              )}

              {message && (
                <p role="status" className="text-sm leading-6">
                  {message}
                </p>
              )}

              {outcome && (
                <div className="rounded-md border border-neutral-700 p-3 text-sm">
                  <p>Invitation issued: {String(outcome.invitationIssued === true)}</p>
                  <p>Provider accepted: {String(outcome.deliveryAccepted === true)}</p>
                  <p>Delivery status: {outcome.deliveryStatus ?? "Not confirmed"}</p>
                  <p>Reference: {outcome.reference ?? draft.reference}</p>
                </div>
              )}
            </section>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-neutral-700 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl">Invitation register</h2>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md border border-neutral-600 px-3 py-2 text-sm"
            >
              Refresh records
            </button>
          </div>

          {records.length === 0 ? (
            <p className="text-sm text-neutral-400">
              No institutional invitations are recorded.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="p-2">Recipient</th>
                    <th className="p-2">Reference</th>
                    <th className="p-2">State</th>
                    <th className="p-2">Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(record => (
                    <tr key={record.reference} className="border-b border-neutral-800">
                      <td className="p-2">
                        {record.recipientDisplayName}
                        <span className="block text-xs text-neutral-400">
                          {record.recipientEmail}
                        </span>
                      </td>
                      <td className="p-2">{record.reference}</td>
                      <td className="p-2">{recordState(record)}</td>
                      <td className="p-2">{record.deliveryStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
