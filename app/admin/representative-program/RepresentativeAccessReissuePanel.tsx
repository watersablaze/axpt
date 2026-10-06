"use client";

import { useState } from "react";

type Props = {
  intakeId: string;
  status: string;
};

type ReissueResponse =
  | {
      ok: true;
      access: {
        intakeId: string;
        reference: string;
        status: string;
        accessIssuedAt: string | null;
        accessExpiresAt: string | null;
        accessUrl: string;
      };
    }
  | {
      ok: false;
      error: string;
    };

const ELIGIBLE_STATUSES = new Set(["DRAFT", "RETURNED_FOR_COMPLETION"]);

export default function RepresentativeAccessReissuePanel({
  intakeId,
  status,
}: Props) {
  const [accessDurationDays, setAccessDurationDays] = useState(7);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessUrl, setAccessUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!ELIGIBLE_STATUSES.has(status)) {
    return null;
  }

  async function reissue() {
    setSubmitting(true);
    setError(null);
    setAccessUrl(null);
    setExpiresAt(null);
    setCopied(false);

    try {
      const response = await fetch(
        `/api/admin/representative-program/intakes/${encodeURIComponent(
          intakeId,
        )}/access/reissue`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            accessDurationDays,
          }),
        },
      );

      const payload = (await response.json()) as ReissueResponse;

      if (!response.ok || !payload.ok) {
        setError(
          payload.ok ? "Unable to reissue candidate access." : payload.error,
        );
        return;
      }

      setAccessUrl(payload.access.accessUrl);
      setExpiresAt(payload.access.accessExpiresAt);
    } catch {
      setError("Unable to reach the access reissue service.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyAccessUrl() {
    if (!accessUrl) return;

    try {
      await navigator.clipboard.writeText(accessUrl);
      setCopied(true);
    } catch {
      setError("Unable to copy the private access link.");
    }
  }

  return (
    <section className="rounded border border-amber-500/25 bg-amber-500/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-amber-300/70">
        Candidate Access
      </p>

      <h3 className="mt-2 text-sm font-semibold text-gray-100">
        Reissue Private Access
      </h3>

      <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-400">
        Rotates the private credential for this existing candidate intake. The
        previous credential becomes unusable. Candidate status, qualification,
        admission, appointment, and authority are unchanged.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.15em] text-gray-500">
            Access Window
          </span>

          <select
            value={accessDurationDays}
            onChange={(event) =>
              setAccessDurationDays(Number(event.target.value))
            }
            className="rounded border border-gray-700 bg-black px-3 py-2 text-sm text-white"
          >
            <option value={3}>3 days</option>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </label>

        <button
          type="button"
          disabled={submitting}
          onClick={() => void reissue()}
          className="rounded border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/20 disabled:opacity-50"
        >
          {submitting ? "Reissuing…" : "Reissue Private Access"}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

      {accessUrl ? (
        <div className="mt-4 rounded border border-gray-800 bg-black p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
            New Private Candidate Link
          </p>

          <p className="mt-3 break-all font-mono text-xs leading-5 text-gray-300">
            {accessUrl}
          </p>

          {expiresAt ? (
            <p className="mt-2 text-xs text-gray-500">
              Expires {new Date(expiresAt).toLocaleString()}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void copyAccessUrl()}
            className="mt-3 rounded border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-200"
          >
            {copied ? "Copied" : "Copy Private Link"}
          </button>

          <p className="mt-3 text-xs leading-5 text-amber-100/70">
            Preserve this link securely. The raw credential is shown at issuance
            and is not stored for later recovery.
          </p>
        </div>
      ) : null}
    </section>
  );
}
