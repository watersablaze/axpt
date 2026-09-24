"use client";

import { useState, type FormEvent } from "react";

type ActionResponse =
  | { ok: true }
  | { ok: false; error: string };

export default function RepresentativeIntakeDecisionControls({
  intakeId,
  status,
  onChanged,
}: {
  intakeId: string;
  status: string;
  onChanged: () => Promise<void>;
}) {
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitAction(
    action: "review" | "qualify",
    body: Record<string, string>,
  ) {
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/representative-program/intakes/${encodeURIComponent(intakeId)}/${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify(body),
        },
      );
      const payload = (await response.json()) as ActionResponse;

      if (!response.ok || !payload.ok) {
        setError(
          payload.ok
            ? `Unable to record ${action} (${response.status}).`
            : payload.error,
        );
        return;
      }

      setNotes("");
      await onChanged();
    } catch {
      setError("Unable to reach the decision service.");
    } finally {
      setBusy(false);
    }
  }

  async function qualify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const internalNotes = notes.trim();
    if (!internalNotes) return;

    await submitAction("qualify", {
      decision: "QUALIFY",
      internalNotes,
    });
  }

  if (status !== "SUBMITTED" && status !== "UNDER_REVIEW") {
    return status === "QUALIFIED" ? (
      <p className="rounded border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100">
        Candidate qualified. Admission remains a separate decision requiring
        the executed Master Agreement.
      </p>
    ) : null;
  }

  return (
    <section className="rounded border border-blue-500/20 bg-blue-950/10 p-4">
      <h3 className="text-sm font-semibold text-white">
        Operator Decision
      </h3>

      {status === "SUBMITTED" ? (
        <div className="mt-3">
          <p className="text-sm text-gray-400">
            Open French-Ward’s review of this submitted intake.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void submitAction("review", {})}
            className="mt-3 rounded border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-200 hover:bg-blue-500/20 disabled:opacity-50"
          >
            {busy ? "Recording…" : "Begin Review"}
          </button>
        </div>
      ) : (
        <form onSubmit={qualify} className="mt-3 space-y-3">
          <p className="text-sm text-gray-400">
            Record the reason for qualification. This decision does not admit
            the candidate or grant representative authority.
          </p>
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-wide text-gray-400">
              Internal Qualification Notes
            </span>
            <textarea
              required
              maxLength={4000}
              rows={5}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Record the basis for this decision"
              className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-gray-500"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !notes.trim()}
            className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {busy ? "Recording…" : "Record Qualification"}
          </button>
        </form>
      )}

      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </section>
  );
}
