"use client";

import { FormEvent, useMemo, useState } from "react";

type InvitationResult = {
  id: string;
  reference: string;
  candidateDisplayName: string;
  candidateEmail: string;
  status: string;
  accessIssuedAt: string | null;
  accessExpiresAt: string | null;
  accessUrl: string;
};

type InvitationResponse =
  | {
      ok: true;
      invitation: InvitationResult;
    }
  | {
      ok: false;
      error: string;
      issues?: Record<string, string[] | undefined>;
    };

const ACCESS_DURATION_OPTIONS = [
  {
    value: 3,
    label: "3 days",
  },
  {
    value: 7,
    label: "7 days",
  },
  {
    value: 14,
    label: "14 days",
  },
  {
    value: 30,
    label: "30 days",
  },
] as const;

function buildCandidateMessage(invitation: InvitationResult) {
  return [
    `Hello ${invitation.candidateDisplayName},`,
    "",
    "French-Ward has opened a private candidate intake for the Authorized Representation Program.",
    "",
    "Please use the secure link below to review and complete your information:",
    "",
    invitation.accessUrl,
    "",
    `Invitation reference: ${invitation.reference}`,
    "",
    "This invitation is an intake and review step only. It does not constitute an appointment, mandate, delegated authority, or authorization to represent French-Ward.",
    "",
    "Please complete the intake accurately and only provide information you are authorized to provide.",
  ].join("\n");
}

export default function RepresentativeInvitationForm() {
  const [candidateDisplayName, setCandidateDisplayName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [accessDurationDays, setAccessDurationDays] = useState(7);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const candidateMessage = useMemo(
    () => (invitation ? buildCandidateMessage(invitation) : ""),
    [invitation],
  );

  async function issueInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError(null);
    setInvitation(null);
    setCopied(null);

    try {
      const response = await fetch(
        "/api/admin/representative-program/invitations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            candidateDisplayName,
            candidateEmail,
            accessDurationDays,
          }),
        },
      );

      const payload = (await response.json()) as InvitationResponse;

      if (!response.ok || !payload.ok) {
        setError(
          payload.ok
            ? "Unable to issue invitation."
            : payload.error || "Unable to issue invitation.",
        );
        return;
      }

      setInvitation(payload.invitation);
    } catch {
      setError("Unable to reach the invitation service.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyValue(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);

      window.setTimeout(() => {
        setCopied(null);
      }, 1800);
    } catch {
      setCopied("Unable to copy");
    }
  }

  return (
    <div className="grid gap-6">
      <form
        onSubmit={issueInvitation}
        className="rounded border border-gray-800 bg-gray-950 p-5"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
            Candidate Entry
          </p>

          <h2 className="mt-2 text-xl font-semibold text-white">
            Create Representative Invitation
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
            This creates a DRAFT candidate intake and one private access
            credential. It does not create a Program Participant, docket,
            appointment, or authority.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Candidate Name
            </span>

            <input
              required
              value={candidateDisplayName}
              onChange={(event) => setCandidateDisplayName(event.target.value)}
              autoComplete="name"
              placeholder="Full legal or professional name"
              className="rounded border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-gray-500"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Candidate Email
            </span>

            <input
              required
              type="email"
              value={candidateEmail}
              onChange={(event) => setCandidateEmail(event.target.value)}
              autoComplete="email"
              placeholder="candidate@example.com"
              className="rounded border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-gray-500"
            />
          </label>

          <label className="grid gap-2 md:max-w-xs">
            <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Private Access Window
            </span>

            <select
              value={accessDurationDays}
              onChange={(event) =>
                setAccessDurationDays(Number(event.target.value))
              }
              className="rounded border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-gray-500"
            >
              {ACCESS_DURATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Issuing…" : "Create Private Invitation"}
          </button>

          <span className="text-xs text-gray-500">
            Raw access credentials are not stored.
          </span>
        </div>

        {error ? (
          <div className="mt-5 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
      </form>

      {invitation ? (
        <section className="rounded border border-emerald-500/30 bg-emerald-950/10 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">
                Invitation Issued
              </p>

              <h2 className="mt-2 text-xl font-semibold text-white">
                {invitation.candidateDisplayName}
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                {invitation.candidateEmail}
              </p>
            </div>

            <div className="rounded border border-gray-700 bg-black px-3 py-2 text-xs text-gray-300">
              {invitation.status}
            </div>
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded border border-gray-800 bg-black p-3">
              <dt className="text-xs uppercase tracking-[0.16em] text-gray-500">
                Operational Reference
              </dt>
              <dd className="mt-2 font-mono text-sm text-gray-200">
                {invitation.reference}
              </dd>
            </div>

            <div className="rounded border border-gray-800 bg-black p-3">
              <dt className="text-xs uppercase tracking-[0.16em] text-gray-500">
                Access Expires
              </dt>
              <dd className="mt-2 text-sm text-gray-200">
                {invitation.accessExpiresAt
                  ? new Date(invitation.accessExpiresAt).toLocaleString()
                  : "No expiry recorded"}
              </dd>
            </div>
          </dl>

          <div className="mt-5 rounded border border-gray-800 bg-black p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Private Candidate Link
            </p>

            <p className="mt-3 break-all font-mono text-xs leading-5 text-gray-300">
              {invitation.accessUrl}
            </p>

            <button
              type="button"
              onClick={() =>
                copyValue("Private candidate link", invitation.accessUrl)
              }
              className="mt-4 rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20"
            >
              Copy Private Link
            </button>
          </div>

          <div className="mt-4 rounded border border-gray-800 bg-black p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Candidate Message
            </p>

            <pre className="mt-3 whitespace-pre-wrap rounded border border-gray-900 bg-gray-950 p-3 text-xs leading-5 text-gray-300">
              {candidateMessage}
            </pre>

            <button
              type="button"
              onClick={() => copyValue("Candidate message", candidateMessage)}
              className="mt-4 rounded border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-500/20"
            >
              Copy Candidate Message
            </button>
          </div>

          <div className="mt-4 rounded border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-amber-100/80">
            Candidate access UI is established in P1.4. Do not send a live
            invitation externally until that ingress has passed release
            verification.
          </div>

          {copied ? (
            <p className="mt-3 text-xs text-emerald-300">
              {copied === "Unable to copy" ? copied : `${copied} copied.`}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
