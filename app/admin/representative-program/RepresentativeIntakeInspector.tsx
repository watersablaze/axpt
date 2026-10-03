"use client";

import { useEffect, useState, type FormEvent } from "react";

import RepresentativeAccessReissuePanel from "./RepresentativeAccessReissuePanel";
import RepresentativeIntakeDecisionControls from "./RepresentativeIntakeDecisionControls";
import RepresentativeMasterAgreementPanel from "./RepresentativeMasterAgreementPanel";
import RepresentativeAppointmentPreparationPanel from "./RepresentativeAppointmentPreparationPanel";
import RepresentativeCommunicationsPanel from "./RepresentativeCommunicationsPanel";

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
  communications: Array<{
    id: number;
    type: string | null;
    from: string | null;
    to: string | null;
    subject: string | null;
    messageId: string | null;
    status: string | null;
    createdAt: string;
  }>;
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function recordAt(
  source: Record<string, unknown> | null,
  key: string,
): Record<string, unknown> | null {
  return source ? asRecord(source[key]) : null;
}

function stringAt(
  source: Record<string, unknown> | null,
  key: string,
): string | null {
  const value = source?.[key];

  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function stringsAt(
  source: Record<string, unknown> | null,
  key: string,
): string[] {
  const value = source?.[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" &&
      Boolean(item.trim()),
  );
}

function booleanAt(
  source: Record<string, unknown> | null,
  key: string,
): boolean | null {
  const value = source?.[key];

  return typeof value === "boolean"
    ? value
    : null;
}

function ReadOnlySubmissionValue({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded border border-gray-800 bg-gray-950 p-3">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
        {label}
      </dt>
      <dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-5 text-gray-200">
        {value || "Not provided"}
      </dd>
    </div>
  );
}

function CandidateSubmissionDossier({
  submission,
  submittedAt,
}: {
  submission: unknown | null;
  submittedAt: string | null;
}) {
  const root = asRecord(submission);

  if (!root) {
    return (
      <section className="rounded border border-gray-800 bg-black p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
          Submitted Intake
        </p>
        <h3 className="mt-2 text-base font-semibold text-white">
          Candidate Submission
        </h3>
        <p className="mt-3 text-sm text-gray-400">
          No structured submission is recorded for this intake.
        </p>
      </section>
    );
  }

  const identity = recordAt(root, "identity");
  const professional = recordAt(root, "professionalProfile");
  const representation = recordAt(root, "representationContext");
  const disclosures = recordAt(root, "disclosures");
  const acknowledgements = recordAt(root, "acknowledgements");

  const listValue = (
    source: Record<string, unknown> | null,
    key: string,
  ) => {
    const values = stringsAt(source, key);
    return values.length ? values.join("\n") : null;
  };

  const acknowledgementValue = (
    key: string,
  ) => {
    const value = booleanAt(acknowledgements, key);

    if (value === true) return "Acknowledged";
    if (value === false) return "Not acknowledged";
    return "Not recorded";
  };

  return (
    <section className="rounded border border-cyan-900/70 bg-[#020a10] p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-500/80">
            Submitted Intake
          </p>
          <h3 className="mt-2 text-base font-semibold text-white">
            Candidate-Supplied Review Record
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-5 text-gray-400">
            Read-only record of the information supplied by the candidate.
            Operator qualification should be based on this submitted record
            together with any independently reviewed materials.
          </p>
        </div>

        <div className="rounded border border-cyan-900/60 bg-black px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300">
          Submitted · {displayDate(submittedAt)}
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            01 · Candidate Identity
          </p>

          <dl className="grid gap-3 sm:grid-cols-2">
            <ReadOnlySubmissionValue
              label="Full Legal Name"
              value={stringAt(identity, "fullLegalName")}
            />
            <ReadOnlySubmissionValue
              label="Preferred Professional Name"
              value={stringAt(identity, "preferredProfessionalName")}
            />
            <ReadOnlySubmissionValue
              label="Email"
              value={stringAt(identity, "email")}
            />
            <ReadOnlySubmissionValue
              label="Nationality"
              value={stringAt(identity, "nationality")}
            />
            <ReadOnlySubmissionValue
              label="Country of Residence"
              value={stringAt(identity, "countryOfResidence")}
            />
            <ReadOnlySubmissionValue
              label="Telephone"
              value={stringAt(identity, "telephone")}
            />
            <ReadOnlySubmissionValue
              label="WhatsApp"
              value={stringAt(identity, "whatsapp")}
            />
            <ReadOnlySubmissionValue
              label="Passport / ID Reference"
              value={stringAt(identity, "passportOrIdReference")}
            />
          </dl>

          <dl className="mt-3">
            <ReadOnlySubmissionValue
              label="Primary Address"
              value={stringAt(identity, "primaryAddress")}
            />
          </dl>
        </section>

        <section className="border-t border-gray-800 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            02 · Professional Profile
          </p>

          <dl className="grid gap-3 sm:grid-cols-2">
            <ReadOnlySubmissionValue
              label="Current Occupation / Role"
              value={stringAt(professional, "currentOccupationOrRole")}
            />
            <ReadOnlySubmissionValue
              label="Companies / Organizations"
              value={listValue(
                professional,
                "companyOrOrganizationAffiliations",
              )}
            />
            <ReadOnlySubmissionValue
              label="Relevant Markets / Industries"
              value={listValue(
                professional,
                "relevantMarketsOrIndustries",
              )}
            />
            <ReadOnlySubmissionValue
              label="Primary Territories"
              value={listValue(
                professional,
                "primaryTerritories",
              )}
            />
            <ReadOnlySubmissionValue
              label="Languages"
              value={listValue(
                professional,
                "languages",
              )}
            />
            <ReadOnlySubmissionValue
              label="Commercial Capabilities"
              value={listValue(
                professional,
                "commercialCapabilities",
              )}
            />
          </dl>
        </section>

        <section className="border-t border-gray-800 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            03 · Representation Context
          </p>

          <dl className="grid gap-3 sm:grid-cols-2">
            <ReadOnlySubmissionValue
              label="Introduction Context"
              value={stringAt(
                representation,
                "introductionContext",
              )}
            />
            <ReadOnlySubmissionValue
              label="Expected Contribution"
              value={stringAt(
                representation,
                "expectedContribution",
              )}
            />
            <ReadOnlySubmissionValue
              label="Relevant Relationships / Networks"
              value={stringAt(
                representation,
                "relevantRelationshipsOrNetworks",
              )}
            />
            <ReadOnlySubmissionValue
              label="Anticipated Representation Areas"
              value={listValue(
                representation,
                "anticipatedRepresentationAreas",
              )}
            />
          </dl>
        </section>

        <section className="border-t border-amber-900/40 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-500/80">
            04 · Disclosures
          </p>

          <dl className="grid gap-3 sm:grid-cols-2">
            <ReadOnlySubmissionValue
              label="Existing Mandates / Representative Relationships"
              value={stringAt(
                disclosures,
                "existingMandatesOrRepresentativeRelationships",
              )}
            />
            <ReadOnlySubmissionValue
              label="Potential Conflicts"
              value={stringAt(
                disclosures,
                "potentialConflicts",
              )}
            />
            <ReadOnlySubmissionValue
              label="Regulated Activities"
              value={stringAt(
                disclosures,
                "regulatedActivities",
              )}
            />
            <ReadOnlySubmissionValue
              label="Material Affiliations"
              value={stringAt(
                disclosures,
                "materialAffiliations",
              )}
            />
          </dl>
        </section>

        <section className="border-t border-gray-800 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            05 · Candidate Assertions
          </p>

          <dl className="grid gap-3 sm:grid-cols-2">
            <ReadOnlySubmissionValue
              label="No Implied Authority"
              value={acknowledgementValue("noImpliedAuthority")}
            />
            <ReadOnlySubmissionValue
              label="Commercial Terms Remain Controlled"
              value={acknowledgementValue(
                "noUnauthorizedCommercialTermChanges",
              )}
            />
            <ReadOnlySubmissionValue
              label="No Impersonation"
              value={acknowledgementValue(
                "noImpersonationOfFrenchWard",
              )}
            />
            <ReadOnlySubmissionValue
              label="No Unauthorized Subdelegation"
              value={acknowledgementValue(
                "noUnauthorizedSubdelegation",
              )}
            />
            <ReadOnlySubmissionValue
              label="Confidentiality"
              value={acknowledgementValue(
                "confidentialityAcknowledged",
              )}
            />
            <ReadOnlySubmissionValue
              label="Written Appointment Controls Authority"
              value={acknowledgementValue(
                "writtenAppointmentControlsAuthority",
              )}
            />
            <ReadOnlySubmissionValue
              label="Information Accurate / Materially Complete"
              value={acknowledgementValue(
                "informationAccurateToBestKnowledge",
              )}
            />
          </dl>
        </section>
      </div>

      <details className="mt-5 border-t border-gray-800 pt-4">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
          Raw Submission Record
        </summary>
        <pre className="mt-4 max-h-[26rem] overflow-auto whitespace-pre-wrap break-words rounded border border-gray-800 bg-black p-3 text-xs leading-5 text-gray-400">
          {JSON.stringify(submission, null, 2)}
        </pre>
      </details>
    </section>
  );
}

export default function RepresentativeIntakeInspector({
  focusedIntakeId,
  onFocusedIntakeChange,
}: {
  focusedIntakeId?: string | null;
  onFocusedIntakeChange?: (intakeId: string) => void;
}) {
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

    // Preserve the focused record during a same-intake refresh so
    // child operator controls retain their local success state.
    // Clear only when moving to a different candidate.
    if (intake?.id !== id) {
      setIntake(null);
    }

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

  useEffect(() => {
    if (!focusedIntakeId) return;

    setIntakeId(focusedIntakeId);
    void loadIntakeById(focusedIntakeId);
  }, [focusedIntakeId]);

  async function loadIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const identifier = intakeId.trim();

    if (!identifier) return;

    let resolvedId = identifier;

    if (identifier.toUpperCase().startsWith("FWI-")) {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/representative-program/intakes?q=${encodeURIComponent(
            identifier,
          )}`,
          { cache: "no-store" },
        );

        const payload = (await response.json()) as SearchResponse;

        if (!response.ok || !payload.ok) {
          setError(
            payload.ok
              ? `Unable to resolve intake reference (${response.status}).`
              : payload.error,
          );
          return;
        }

        const exact = payload.intakes.find(
          (item) => item.reference.toLowerCase() === identifier.toLowerCase(),
        );

        if (!exact) {
          setError("No intake matches that institutional reference.");
          return;
        }

        resolvedId = exact.id;
        setIntakeId(exact.id);
      } catch {
        setError("Unable to resolve the intake reference.");
        return;
      } finally {
        setLoading(false);
      }
    }

    if (onFocusedIntakeChange && resolvedId !== focusedIntakeId) {
      onFocusedIntakeChange(resolvedId);
      return;
    }

    await loadIntakeById(resolvedId);
  }

  return (
    <section
      aria-busy={loading}
      className={[
        "mx-auto w-full rounded border border-gray-800 bg-gray-950 p-5",
        intake ? "max-w-3xl" : "max-w-2xl",
      ].join(" ")}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
        Operator Review
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white">
        Inspect Candidate Intake
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-5 text-gray-400">
        Search the candidate registry first. Use exact lookup only when you
        already have a known institutional identifier. Viewing this record makes
        no status change.
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

                  if (onFocusedIntakeChange && match.id !== focusedIntakeId) {
                    onFocusedIntakeChange(match.id);
                    return;
                  }

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

      <details className="mt-5 rounded border border-gray-900 bg-black">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3">
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Exact lookup
            </span>
            <span className="mt-1 block text-xs text-gray-600">
              Load by internal ID or institutional reference
            </span>
          </span>

          <span className="rounded border border-gray-800 bg-gray-950 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-gray-600">
            Fallback
          </span>
        </summary>

        <div className="border-t border-gray-900 px-4 py-4">
          <form
            onSubmit={loadIntake}
            className="flex flex-wrap items-end gap-3"
          >
            <label className="grid min-w-64 flex-1 gap-2">
              <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
                Intake ID or Reference
              </span>
              <input
                required
                maxLength={191}
                value={intakeId}
                onChange={(event) => setIntakeId(event.target.value)}
                placeholder="Paste internal ID or FWI reference"
                className="rounded border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-gray-500"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="rounded border border-gray-700 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-300 hover:border-gray-600 hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Loading…" : "Load Intake"}
            </button>
          </form>
        </div>
      </details>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {intake ? (
        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
          <div className="space-y-5">
            <div className="rounded border border-gray-800 bg-black p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                    Focused Candidate
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {intake.candidateDisplayName}
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    {intake.candidateEmail}
                  </p>
                  <p className="mt-2 break-all font-mono text-xs text-gray-500">
                    {intake.reference} · {intake.id}
                  </p>
                </div>

                <div className="rounded border border-gray-700 bg-gray-950 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-300">
                  {intake.status}
                </div>
              </div>
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
                [
                  "Master Agreement ID",
                  intake.masterAgreementInstrumentId ?? "—",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded border border-gray-800 bg-black p-3"
                >
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

            <CandidateSubmissionDossier
              submission={intake.submission}
              submittedAt={intake.submittedAt}
            />
          </div>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded border border-gray-800 bg-black p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                Operator Actions
              </p>
              <p className="mt-2 text-xs leading-5 text-gray-400">
                Controls appear only when the candidate reaches the lifecycle
                state that permits them.
              </p>
            </div>

            <RepresentativeCommunicationsPanel
              key={`${intake.id}-communications`}
              intakeId={intake.id}
              status={intake.status}
              submittedAt={intake.submittedAt}
              candidateEmail={intake.candidateEmail}
              communications={intake.communications}
              onChanged={() => loadIntakeById(intake.id)}
            />

            <RepresentativeAccessReissuePanel
              key={`${intake.id}-access`}
              intakeId={intake.id}
              status={intake.status}
            />

            <RepresentativeIntakeDecisionControls
              key={intake.id}
              intakeId={intake.id}
              status={intake.status}
              onChanged={() => loadIntakeById(intake.id)}
            />

            {intake.status === "QUALIFIED" || intake.status === "ADMITTED" ? (
              <RepresentativeMasterAgreementPanel
                key={`${intake.id}-agreement`}
                intake={intake}
                onChanged={() => loadIntakeById(intake.id)}
              />
            ) : (
              <section className="rounded border border-gray-800 bg-gray-950 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
                  Agreement Control
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-200">
                  Not yet available
                </p>
                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Master Agreement controls remain withheld until candidate
                  qualification. Submission and review do not create Agreement,
                  admission, appointment, or authority.
                </p>
              </section>
            )}

            {intake.status === "ADMITTED" && intake.admittedParticipantId ? (
              <RepresentativeAppointmentPreparationPanel
                key={`${intake.id}-appointment`}
                participantId={intake.admittedParticipantId}
                candidateDisplayName={intake.candidateDisplayName}
              />
            ) : null}
          </aside>
        </div>
      ) : null}
    </section>
  );
}
