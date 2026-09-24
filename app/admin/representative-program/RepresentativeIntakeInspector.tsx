"use client";

import { useState, type FormEvent } from "react";

import RepresentativeIntakeDecisionControls from "./RepresentativeIntakeDecisionControls";
import RepresentativeMasterAgreementPanel from "./RepresentativeMasterAgreementPanel";

type Intake = {
  id: string;
  reference: string;
  candidateDisplayName: string;
  candidateEmail: string;
  status: string;
  qualificationDecision: string;
  submission: unknown | null;
  internalNotes: string | null;
  submittedAt: string | null;
  reviewStartedAt: string | null;
  qualifiedAt: string | null;
  admittedAt: string | null;
  admittedParticipantId: string | null;
  masterAgreementInstrumentId: string | null;
};

type IntakeLookup = Pick<
  Intake,
  "id" | "reference" | "candidateDisplayName" | "candidateEmail" | "status"
>;

type SearchResponse =
  | { ok: true; intakes: IntakeLookup[] }
  | { ok: false; error: string };

type IntakeResponse =
  | { ok: true; intake: Intake }
  | { ok: false; error: string };

function displayDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function RepresentativeIntakeInspector() {
  const [intakeId, setIntakeId] = useState("");
  const [intake, setIntake] = useState<Intake | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [matches, setMatches] = useState<IntakeLookup[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function searchIntakes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    if (query.length < 2) return;

    setSearching(true);
    setSearched(false);
    setSearchError(null);
    setMatches([]);

    try {
      const response = await fetch(
        `/api/admin/representative-program/intakes?q=${encodeURIComponent(query)}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as SearchResponse;
      if (!response.ok || !payload.ok) {
        setSearchError(
          payload.ok
            ? `Unable to search intakes (${response.status}).`
            : payload.error,
        );
        return;
      }
      setMatches(payload.intakes);
      setSearched(true);
    } catch {
      setSearchError("Unable to reach the intake search service.");
    } finally {
      setSearching(false);
    }
  }

  async function loadIntakeById(id: string) {
    if (!id) return;

    setLoading(true);
    setError(null);
    setIntake(null);

    try {
      const response = await fetch(
        `/api/admin/representative-program/intakes/${encodeURIComponent(id)}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as IntakeResponse;

      if (!response.ok || !payload.ok) {
        setError(
          payload.ok
            ? `Unable to load intake (${response.status}).`
            : payload.error,
        );
        return;
      }

      setIntake(payload.intake);
    } catch {
      setError("Unable to reach the intake service.");
    } finally {
      setLoading(false);
    }
  }

  async function loadIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadIntakeById(intakeId.trim());
  }

  return (
    <section
      aria-busy={loading}
      className="mt-6 rounded border border-gray-800 bg-gray-950 p-5"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
        Operator Review
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white">
        Inspect Candidate Intake
      </h2>
      <p className="mt-2 text-sm text-gray-400">
        Load an intake by its ID to inspect the submission and recorded
        decisions. Viewing this record makes no status change.
      </p>

      <form
        onSubmit={searchIntakes}
        className="mt-5 flex flex-wrap items-end gap-3"
      >
        <label className="grid min-w-64 flex-1 gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Find Candidate
          </span>
          <input
            required
            minLength={2}
            maxLength={100}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, email, or reference"
            className="rounded border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-gray-500"
          />
        </label>
        <button
          type="submit"
          disabled={searching}
          className="rounded border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 disabled:opacity-50"
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </form>

      {searchError ? (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {searchError}
        </p>
      ) : null}

      {searched && matches.length === 0 ? (
        <p role="status" className="mt-3 text-sm text-gray-400">
          No matching intakes.
        </p>
      ) : null}

      {matches.length > 0 ? (
        <ul aria-label="Matching intakes" className="mt-3 space-y-2">
          {matches.map((match) => (
            <li key={match.id}>
              <button
                type="button"
                onClick={() => {
                  setIntakeId(match.id);
                  void loadIntakeById(match.id);
                }}
                className="w-full rounded border border-gray-800 bg-black p-3 text-left hover:border-gray-600"
              >
                <span className="block text-sm font-semibold text-white">
                  {match.candidateDisplayName}
                </span>
                <span className="mt-1 block text-xs text-gray-400">
                  {match.candidateEmail} · {match.reference} · {match.status}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <form onSubmit={loadIntake} className="mt-5 flex flex-wrap items-end gap-3">
        <label className="grid min-w-64 flex-1 gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Intake ID
          </span>
          <input
            required
            maxLength={191}
            value={intakeId}
            onChange={(event) => setIntakeId(event.target.value)}
            placeholder="Paste the intake ID"
            className="rounded border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-gray-500"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200 hover:bg-blue-500/20 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load Intake"}
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {intake ? (
        <div className="mt-6 space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {intake.candidateDisplayName}
            </h3>
            <p className="text-sm text-gray-400">{intake.candidateEmail}</p>
            <p className="mt-1 font-mono text-xs text-gray-500">
              {intake.reference} · {intake.id}
            </p>
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              ["Intake status", intake.status],
              ["Qualification decision", intake.qualificationDecision],
              ["Submitted", displayDate(intake.submittedAt)],
              ["Review opened", displayDate(intake.reviewStartedAt)],
              ["Qualified", displayDate(intake.qualifiedAt)],
              ["Admitted", displayDate(intake.admittedAt)],
              ["Participant ID", intake.admittedParticipantId ?? "—"],
              ["Master Agreement ID", intake.masterAgreementInstrumentId ?? "—"],
            ].map(([label, value]) => (
              <div key={label} className="rounded border border-gray-800 bg-black p-3">
                <dt className="text-xs uppercase tracking-wide text-gray-500">
                  {label}
                </dt>
                <dd className="mt-2 break-all text-gray-200">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="rounded border border-gray-800 bg-black p-4">
            <h3 className="text-sm font-semibold text-gray-200">
              Internal Review Notes
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-400">
              {intake.internalNotes || "No notes recorded."}
            </p>
          </div>

          <details className="rounded border border-gray-800 bg-black p-4">
            <summary className="cursor-pointer text-sm font-semibold text-gray-200">
              Candidate Submission
            </summary>
            <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-gray-300">
              {intake.submission === null
                ? "No submission recorded."
                : JSON.stringify(intake.submission, null, 2)}
            </pre>
          </details>

          <RepresentativeIntakeDecisionControls
            key={intake.id}
            intakeId={intake.id}
            status={intake.status}
            onChanged={() => loadIntakeById(intake.id)}
          />

          <RepresentativeMasterAgreementPanel
            key={`${intake.id}-agreement`}
            intake={intake}
          />
        </div>
      ) : null}
    </section>
  );
}
