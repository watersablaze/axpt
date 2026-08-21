"use client";

import { FormEvent, useState } from "react";

type Money = Readonly<{
  amount: string;

  currency: string;
}>;

type PreExecutionTransfer = Readonly<{
  id: string;

  reference: string;

  status: string;

  version: number;

  programId: string;

  instructionId?: string;

  requestedAmount: Money;

  destinationCurrency: string;

  purpose: string;

  createdAt: string;

  updatedAt: string;
}>;

type TransferExecutionSummary = Readonly<{
  transferId: string;

  transferStatus: string;

  transferVersion: number;

  planId: string;

  planStatus: string;

  planVersion: number;

  trancheCounts: Readonly<{
    total: number;

    planned: number;

    eligible: number;

    ineligible: number;

    requiresClarification: number;

    boundToExecution: number;
  }>;

  executionCounts: Readonly<Record<string, number>>;

  amounts: Readonly<{
    planned: Money;

    bound: Money;

    confirmed: Money;

    failed: Money;

    remainingUnbound: Money;
  }>;

  lastUpdatedAt: string;
}>;

type TransferExecutionPerception =
  | Readonly<{
      kind: "PRE_EXECUTION";

      transfer: PreExecutionTransfer;
    }>
  | Readonly<{
      kind: "EXECUTION_SUMMARY";

      summary: TransferExecutionSummary;
    }>;

type PerceptionResponse =
  | Readonly<{
      ok: true;

      perception: TransferExecutionPerception;
    }>
  | Readonly<{
      ok: false;

      error: string;
    }>;

type AuthorityReviewResponse =
  | Readonly<{
      ok: true;

      disposition: "STARTED" | "REPLAYED";

      transfer: Readonly<{
        id: string;

        reference: string;

        status: string;

        version: number;

        programId: string;

        updatedAt: string;
      }>;
    }>
  | Readonly<{
      ok: false;

      error: string;
    }>;

type RecordedAuthorityAssessment = Readonly<{
  id: string;

  transferId: string;

  result: string;

  instructionId?: string;

  authorityGrantId?: string;

  evidenceArtifactIds: readonly string[];

  assessedByActorId: string;

  assessedAt: string;

  notes?: string;

  version: number;

  createdAt: string;
}>;

type RecordAuthorityAssessmentResponse =
  | Readonly<{
      ok: true;

      disposition: "RECORDED" | "REPLAYED";

      assessment: RecordedAuthorityAssessment;
    }>
  | Readonly<{
      ok: false;

      error: string;
    }>;

type ApplyAuthorityAssessmentResponse =
  | Readonly<{
      ok: true;

      disposition: "APPLIED" | "REPLAYED";

      transfer: Readonly<{
        id: string;

        reference: string;

        status: string;

        version: number;

        programId: string;

        updatedAt: string;
      }>;

      assessmentId: string;
    }>
  | Readonly<{
      ok: false;

      error: string;
    }>;

const AUTHORITY_ASSESSMENT_RESULTS = [
  "AUTHORIZED",
  "REQUIRES_CLARIFICATION",
  "NOT_AUTHORIZED",
] as const;

type AuthorityAssessmentResult = (typeof AUTHORITY_ASSESSMENT_RESULTS)[number];

function formatMoney(money: Money): string {
  const numericAmount = Number(money.amount);

  if (!Number.isFinite(numericAmount)) {
    return `${money.amount} ${money.currency}`;
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(numericAmount)} ${money.currency}`;
}

function countExecution(
  summary: TransferExecutionSummary,
  status: string,
): number {
  return summary.executionCounts[status] ?? 0;
}

export default function TransferExecutionSummaryPanel() {
  const [transferId, setTransferId] = useState("");

  const [perception, setPerception] =
    useState<TransferExecutionPerception | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [reviewLoading, setReviewLoading] = useState(false);

  const [reviewError, setReviewError] = useState<string | null>(null);

  const [reviewIdempotencyKey, setReviewIdempotencyKey] = useState<
    string | null
  >(null);

  const [assessmentResult, setAssessmentResult] =
    useState<AuthorityAssessmentResult>("AUTHORIZED");

  const [assessmentInstructionId, setAssessmentInstructionId] = useState("");

  const [assessmentAuthorityGrantId, setAssessmentAuthorityGrantId] =
    useState("");

  const [assessmentEvidenceIds, setAssessmentEvidenceIds] = useState("");

  const [assessmentNotes, setAssessmentNotes] = useState("");

  const [recordedAssessment, setRecordedAssessment] =
    useState<RecordedAuthorityAssessment | null>(null);

  const [assessmentLoading, setAssessmentLoading] = useState(false);

  const [assessmentError, setAssessmentError] = useState<string | null>(null);

  const [assessmentIdempotencyKey, setAssessmentIdempotencyKey] = useState<
    string | null
  >(null);

  const [applicationLoading, setApplicationLoading] = useState(false);

  const [applicationError, setApplicationError] = useState<string | null>(null);

  const [applicationIdempotencyKey, setApplicationIdempotencyKey] = useState<
    string | null
  >(null);

  async function loadPerception(
    normalizedTransferId: string,
  ): Promise<boolean> {
    const response = await fetch(
      `/api/admin/control-center/treasury/transfers/${encodeURIComponent(
        normalizedTransferId,
      )}/execution-summary`,
      {
        cache: "no-store",

        credentials: "include",
      },
    );

    const payload = (await response.json()) as PerceptionResponse;

    if (!response.ok || !payload.ok) {
      setPerception(null);

      setError(
        payload.ok ? "Treasury perception could not be loaded." : payload.error,
      );

      return false;
    }

    setPerception(payload.perception);

    setError(null);

    return true;
  }

  async function observeTransfer(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const normalizedTransferId = transferId.trim();

    if (normalizedTransferId.length === 0) {
      setPerception(null);

      setError("Enter a Treasury Transfer ID.");

      return;
    }

    setLoading(true);

    setError(null);

    setReviewError(null);

    setReviewIdempotencyKey(null);

    setRecordedAssessment(null);

    setAssessmentError(null);

    setAssessmentIdempotencyKey(null);

    setApplicationError(null);

    setApplicationIdempotencyKey(null);

    try {
      await loadPerception(normalizedTransferId);
    } catch (cause: unknown) {
      console.error("[CONTROL_CENTER_TREASURY_PERCEPTION_LOAD_FAILED]", cause);

      setPerception(null);

      setError("Treasury perception could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function beginAuthorityReview(): Promise<void> {
    if (!preExecution || preExecution.status !== "CREATED") {
      return;
    }

    const requestKey = reviewIdempotencyKey ?? crypto.randomUUID();

    if (!reviewIdempotencyKey) {
      setReviewIdempotencyKey(requestKey);
    }

    setReviewLoading(true);

    setReviewError(null);

    try {
      const response = await fetch(
        `/api/admin/control-center/treasury/transfers/${encodeURIComponent(
          preExecution.id,
        )}/authority-review`,
        {
          method: "POST",

          cache: "no-store",

          credentials: "include",

          headers: {
            "Idempotency-Key": requestKey,
          },
        },
      );

      const payload = (await response.json()) as AuthorityReviewResponse;

      if (!response.ok || !payload.ok) {
        setReviewError(
          payload.ok
            ? "Treasury authority review could not be started."
            : payload.error,
        );

        return;
      }

      /*
       * Re-enter Treasury through the read boundary after the write.
       * The Control Center does not manufacture the resulting posture.
       */
      const refreshed = await loadPerception(preExecution.id);

      if (refreshed) {
        setReviewIdempotencyKey(null);
      }
    } catch (cause: unknown) {
      console.error("[CONTROL_CENTER_TREASURY_AUTHORITY_REVIEW_FAILED]", cause);

      /*
       * Preserve the key. Treasury may already have accepted the
       * transition even if the browser did not receive confirmation.
       */
      setReviewError(
        "The authority-review response could not be confirmed. Retry the unchanged request to safely resolve its outcome.",
      );
    } finally {
      setReviewLoading(false);
    }
  }

  async function recordAuthorityAssessment(): Promise<void> {
    if (!preExecution || preExecution.status !== "AUTHORITY_REVIEW") {
      return;
    }

    const evidenceArtifactIds = assessmentEvidenceIds
      .split(/\r?\n|,/)
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (evidenceArtifactIds.length === 0) {
      setAssessmentError("Enter at least one evidence artifact ID.");

      return;
    }

    const requestKey = assessmentIdempotencyKey ?? crypto.randomUUID();

    if (!assessmentIdempotencyKey) {
      setAssessmentIdempotencyKey(requestKey);
    }

    const assessedAt = new Date().toISOString();

    setAssessmentLoading(true);

    setAssessmentError(null);

    try {
      const response = await fetch(
        `/api/admin/control-center/treasury/transfers/${encodeURIComponent(
          preExecution.id,
        )}/authority-assessments`,
        {
          method: "POST",

          cache: "no-store",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",

            "Idempotency-Key": requestKey,
          },

          body: JSON.stringify({
            result: assessmentResult,

            instructionId: assessmentInstructionId.trim() || undefined,

            authorityGrantId: assessmentAuthorityGrantId.trim() || undefined,

            evidenceArtifactIds,

            assessedAt,

            notes: assessmentNotes.trim() || undefined,
          }),
        },
      );

      const payload =
        (await response.json()) as RecordAuthorityAssessmentResponse;

      if (!response.ok || !payload.ok) {
        setAssessmentError(
          payload.ok
            ? "Treasury authority assessment could not be recorded."
            : payload.error,
        );

        return;
      }

      setRecordedAssessment(payload.assessment);

      setAssessmentIdempotencyKey(null);

      setApplicationError(null);

      setApplicationIdempotencyKey(null);
    } catch (cause: unknown) {
      console.error(
        "[CONTROL_CENTER_TREASURY_AUTHORITY_ASSESSMENT_RECORD_FAILED]",
        cause,
      );

      /*
       * Preserve the idempotency key. Treasury may already have
       * recorded the finding even if the browser lost confirmation.
       */
      setAssessmentError(
        "The authority-assessment response could not be confirmed. Retry the unchanged finding to safely resolve its outcome.",
      );
    } finally {
      setAssessmentLoading(false);
    }
  }

  async function applyRecordedAuthorityAssessment(): Promise<void> {
    if (!preExecution || !recordedAssessment) {
      return;
    }

    if (recordedAssessment.transferId !== preExecution.id) {
      setApplicationError(
        "The recorded assessment does not belong to the observed Treasury Transfer.",
      );

      return;
    }

    const requestKey = applicationIdempotencyKey ?? crypto.randomUUID();

    if (!applicationIdempotencyKey) {
      setApplicationIdempotencyKey(requestKey);
    }

    setApplicationLoading(true);

    setApplicationError(null);

    try {
      const response = await fetch(
        `/api/admin/control-center/treasury/transfers/${encodeURIComponent(
          preExecution.id,
        )}/authority-assessments/${encodeURIComponent(
          recordedAssessment.id,
        )}/apply`,
        {
          method: "POST",

          cache: "no-store",

          credentials: "include",

          headers: {
            "Idempotency-Key": requestKey,
          },
        },
      );

      const payload =
        (await response.json()) as ApplyAuthorityAssessmentResponse;

      if (!response.ok || !payload.ok) {
        setApplicationError(
          payload.ok
            ? "The recorded authority assessment could not be applied."
            : payload.error,
        );

        return;
      }

      /*
       * Re-enter Treasury through the read boundary after the write.
       * The Control Center does not manufacture the resulting posture.
       */
      const refreshed = await loadPerception(preExecution.id);

      if (refreshed) {
        setApplicationIdempotencyKey(null);
      }
    } catch (cause: unknown) {
      console.error(
        "[CONTROL_CENTER_TREASURY_AUTHORITY_ASSESSMENT_APPLY_FAILED]",
        cause,
      );

      /*
       * Preserve the idempotency key. Treasury may already have
       * applied the finding even if the browser lost confirmation.
       */
      setApplicationError(
        "The authority-assessment application response could not be confirmed. Retry the unchanged application to safely resolve its outcome.",
      );
    } finally {
      setApplicationLoading(false);
    }
  }

  const preExecution =
    perception?.kind === "PRE_EXECUTION" ? perception.transfer : null;

  const summary =
    perception?.kind === "EXECUTION_SUMMARY" ? perception.summary : null;

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <div className="flex flex-col gap-4 border-b border-neutral-800 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            Treasury Perception
          </div>

          <h1 className="mt-1 text-xl font-medium text-white">
            Transfer Execution Posture
          </h1>

          <p className="mt-2 max-w-2xl text-xs leading-5 text-neutral-500">
            Read-only perception of canonical Treasury Transfer state and, where
            established, its execution plan, executable tranches, and bound
            Treasury Executions.
          </p>
        </div>

        <form
          onSubmit={observeTransfer}
          className="flex w-full gap-2 md:w-auto"
        >
          <input
            value={transferId}
            onChange={(event) => setTransferId(event.target.value)}
            placeholder="Treasury Transfer ID"
            aria-label="Treasury Transfer ID"
            className="min-w-0 flex-1 rounded border border-neutral-800 bg-black/40 px-3 py-2 text-xs text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-cyan-900 md:w-80"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded border border-neutral-700 bg-black/30 px-3 py-2 text-[10px] uppercase tracking-wide text-neutral-300 hover:border-cyan-800 hover:text-cyan-300 disabled:cursor-wait disabled:opacity-50"
          >
            {loading ? "Observing" : "Observe"}
          </button>
        </form>
      </div>

      {error ? (
        <div className="mt-4 rounded border border-orange-950 bg-orange-950/10 p-3 text-xs text-orange-300">
          {error}
        </div>
      ) : null}

      {reviewError ? (
        <div className="mt-4 rounded border border-orange-950 bg-orange-950/10 p-3 text-xs leading-5 text-orange-300">
          {reviewError}
        </div>
      ) : null}

      {!perception && !error ? (
        <div className="mt-4 rounded border border-neutral-800 bg-black/20 p-4 text-xs text-neutral-500">
          Enter a Treasury Transfer ID to perceive its current Treasury posture.
        </div>
      ) : null}

      {preExecution ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <article className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Transfer
              </div>

              <div className="mt-2 break-all text-sm text-white">
                {preExecution.id}
              </div>

              <div className="mt-3 flex items-center justify-between gap-4 text-xs">
                <span className="text-neutral-500">Reference</span>

                <span className="text-right text-neutral-300">
                  {preExecution.reference}
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Status</span>

                <span className="text-cyan-300">{preExecution.status}</span>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Version</span>

                <span className="text-neutral-300">{preExecution.version}</span>
              </div>
            </article>

            <article className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Execution Planning
              </div>

              <div className="mt-2 text-sm text-neutral-200">
                Not Yet Established
              </div>

              <p className="mt-3 text-xs leading-5 text-neutral-500">
                This Treasury Transfer exists canonically. No execution plan has
                yet been established for it.
              </p>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Posture</span>

                <span className="text-neutral-300">PRE_EXECUTION</span>
              </div>

              {preExecution.status === "CREATED" ? (
                <div className="mt-4 border-t border-neutral-800 pt-4">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-600">
                    Lifecycle Action
                  </div>

                  <p className="mt-2 text-xs leading-5 text-neutral-500">
                    Admit this Transfer into formal Treasury authority review.
                    This does not authorize, plan, or execute the Transfer.
                  </p>

                  <button
                    type="button"
                    disabled={reviewLoading}
                    onClick={beginAuthorityReview}
                    className="mt-3 rounded border border-cyan-950 bg-cyan-950/20 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-cyan-300 hover:border-cyan-800 hover:bg-cyan-950/30 disabled:cursor-wait disabled:opacity-50"
                  >
                    {reviewLoading
                      ? "Beginning Review"
                      : "Begin Authority Review"}
                  </button>
                </div>
              ) : null}
            </article>
          </div>

          {preExecution.status === "AUTHORITY_REVIEW" ? (
            <section className="rounded-lg border border-neutral-800 bg-black/20 p-4">
              <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-600">
                    Decision Chamber
                  </div>

                  <h2 className="mt-1 text-base font-medium text-white">
                    Authority Assessment
                  </h2>

                  <p className="mt-2 max-w-2xl text-xs leading-5 text-neutral-500">
                    Record an authority finding against the canonical Treasury
                    Transfer. Recording the finding does not itself authorize,
                    reject, or otherwise alter the Transfer posture.
                  </p>
                </div>

                <div className="rounded border border-cyan-950 bg-cyan-950/10 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-cyan-300">
                  Authority Review
                </div>
              </div>

              {!recordedAssessment ? (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <label className="block">
                      <span className="text-[10px] uppercase tracking-wide text-neutral-600">
                        Finding
                      </span>

                      <select
                        value={assessmentResult}
                        onChange={(event) =>
                          setAssessmentResult(
                            event.target.value as AuthorityAssessmentResult,
                          )
                        }
                        disabled={assessmentLoading}
                        className="mt-2 w-full rounded border border-neutral-800 bg-black/40 px-3 py-2 text-xs text-neutral-200 outline-none focus:border-cyan-900 disabled:opacity-50"
                      >
                        <option value="AUTHORIZED">Authorized</option>

                        <option value="REQUIRES_CLARIFICATION">
                          Requires Clarification
                        </option>

                        <option value="NOT_AUTHORIZED">Not Authorized</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-[10px] uppercase tracking-wide text-neutral-600">
                        Instruction ID
                      </span>

                      <input
                        value={assessmentInstructionId}
                        onChange={(event) =>
                          setAssessmentInstructionId(event.target.value)
                        }
                        disabled={assessmentLoading}
                        placeholder="Optional"
                        className="mt-2 w-full rounded border border-neutral-800 bg-black/40 px-3 py-2 text-xs text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-cyan-900 disabled:opacity-50"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] uppercase tracking-wide text-neutral-600">
                        Authority Grant ID
                      </span>

                      <input
                        value={assessmentAuthorityGrantId}
                        onChange={(event) =>
                          setAssessmentAuthorityGrantId(event.target.value)
                        }
                        disabled={assessmentLoading}
                        placeholder="Optional"
                        className="mt-2 w-full rounded border border-neutral-800 bg-black/40 px-3 py-2 text-xs text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-cyan-900 disabled:opacity-50"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] uppercase tracking-wide text-neutral-600">
                        Evidence Artifact IDs
                      </span>

                      <textarea
                        value={assessmentEvidenceIds}
                        onChange={(event) =>
                          setAssessmentEvidenceIds(event.target.value)
                        }
                        disabled={assessmentLoading}
                        rows={4}
                        placeholder={
                          "One artifact ID per line, or separate with commas."
                        }
                        className="mt-2 w-full resize-y rounded border border-neutral-800 bg-black/40 px-3 py-2 text-xs leading-5 text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-cyan-900 disabled:opacity-50"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-[10px] uppercase tracking-wide text-neutral-600">
                      Assessment Notes
                    </span>

                    <textarea
                      value={assessmentNotes}
                      onChange={(event) =>
                        setAssessmentNotes(event.target.value)
                      }
                      disabled={assessmentLoading}
                      rows={4}
                      placeholder="Optional assessment context or documentary observations."
                      className="mt-2 w-full resize-y rounded border border-neutral-800 bg-black/40 px-3 py-2 text-xs leading-5 text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-cyan-900 disabled:opacity-50"
                    />
                  </label>

                  {assessmentError ? (
                    <div className="rounded border border-orange-950 bg-orange-950/10 p-3 text-xs leading-5 text-orange-300">
                      {assessmentError}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 border-t border-neutral-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-xl text-[11px] leading-5 text-neutral-600">
                      The authenticated operator becomes the recorded assessor.
                      Evidence is required. Assessment time is established when
                      this finding is submitted.
                    </p>

                    <button
                      type="button"
                      disabled={assessmentLoading}
                      onClick={recordAuthorityAssessment}
                      className="shrink-0 rounded border border-cyan-950 bg-cyan-950/20 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-cyan-300 hover:border-cyan-800 hover:bg-cyan-950/30 disabled:cursor-wait disabled:opacity-50"
                    >
                      {assessmentLoading
                        ? "Recording Assessment"
                        : "Record Assessment"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="rounded-lg border border-neutral-800 bg-black/30 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-600">
                          Recorded Finding
                        </div>

                        <div className="mt-2 break-all text-sm text-white">
                          {recordedAssessment.id}
                        </div>
                      </div>

                      <div className="rounded border border-neutral-800 bg-black/40 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-cyan-300">
                        {recordedAssessment.result.replaceAll("_", " ")}
                      </div>
                    </div>

                    <dl className="mt-4 grid gap-3 text-xs md:grid-cols-2">
                      <div>
                        <dt className="text-neutral-600">Assessor</dt>

                        <dd className="mt-1 break-all text-neutral-300">
                          {recordedAssessment.assessedByActorId}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-neutral-600">Assessed At</dt>

                        <dd className="mt-1 text-neutral-300">
                          {new Date(
                            recordedAssessment.assessedAt,
                          ).toLocaleString()}
                        </dd>
                      </div>

                      {recordedAssessment.instructionId ? (
                        <div>
                          <dt className="text-neutral-600">Instruction</dt>

                          <dd className="mt-1 break-all text-neutral-300">
                            {recordedAssessment.instructionId}
                          </dd>
                        </div>
                      ) : null}

                      {recordedAssessment.authorityGrantId ? (
                        <div>
                          <dt className="text-neutral-600">Authority Grant</dt>

                          <dd className="mt-1 break-all text-neutral-300">
                            {recordedAssessment.authorityGrantId}
                          </dd>
                        </div>
                      ) : null}
                    </dl>

                    <div className="mt-4">
                      <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                        Evidence
                      </div>

                      <ul className="mt-2 space-y-1">
                        {recordedAssessment.evidenceArtifactIds.map(
                          (artifactId) => (
                            <li
                              key={artifactId}
                              className="break-all text-xs text-neutral-300"
                            >
                              {artifactId}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>

                    {recordedAssessment.notes ? (
                      <div className="mt-4 border-t border-neutral-800 pt-4">
                        <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                          Notes
                        </div>

                        <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-neutral-300">
                          {recordedAssessment.notes}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {applicationError ? (
                    <div className="rounded border border-orange-950 bg-orange-950/10 p-3 text-xs leading-5 text-orange-300">
                      {applicationError}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 border-t border-neutral-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-600">
                        Operative Disposition
                      </div>

                      <p className="mt-2 max-w-xl text-xs leading-5 text-neutral-500">
                        Apply this recorded assessment to the Treasury Transfer.
                        Treasury will load the canonical finding and determine
                        the resulting Transfer posture.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={applicationLoading}
                      onClick={applyRecordedAuthorityAssessment}
                      className="shrink-0 rounded border border-neutral-700 bg-black/30 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-neutral-200 hover:border-cyan-800 hover:text-cyan-300 disabled:cursor-wait disabled:opacity-50"
                    >
                      {applicationLoading
                        ? "Applying Assessment"
                        : "Apply Recorded Assessment"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-3">
            <article className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Program
              </div>

              <div className="mt-2 break-all text-xs text-neutral-200">
                {preExecution.programId}
              </div>

              {preExecution.instructionId ? (
                <>
                  <div className="mt-3 text-[10px] uppercase tracking-wide text-neutral-600">
                    Instruction
                  </div>

                  <div className="mt-2 break-all text-xs text-neutral-300">
                    {preExecution.instructionId}
                  </div>
                </>
              ) : null}
            </article>

            <article className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Requested Capital
              </div>

              <div className="mt-2 text-sm text-white">
                {formatMoney(preExecution.requestedAmount)}
              </div>

              <div className="mt-3 flex items-center justify-between gap-4 text-xs">
                <span className="text-neutral-500">Destination Currency</span>

                <span className="text-neutral-300">
                  {preExecution.destinationCurrency}
                </span>
              </div>
            </article>

            <article className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Purpose
              </div>

              <p className="mt-2 text-xs leading-5 text-neutral-300">
                {preExecution.purpose}
              </p>
            </article>
          </div>

          <div className="flex flex-wrap justify-between gap-3 border-t border-neutral-800 pt-3 text-[10px] uppercase tracking-wide text-neutral-600">
            <span>Read Only</span>

            <span>
              Last observed {new Date(preExecution.updatedAt).toLocaleString()}
            </span>
          </div>
        </div>
      ) : null}

      {summary ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <article className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Transfer
              </div>

              <div className="mt-2 break-all text-sm text-white">
                {summary.transferId}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Status</span>

                <span className="text-cyan-300">{summary.transferStatus}</span>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Version</span>

                <span className="text-neutral-300">
                  {summary.transferVersion}
                </span>
              </div>
            </article>

            <article className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Execution Plan
              </div>

              <div className="mt-2 break-all text-sm text-white">
                {summary.planId}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Status</span>

                <span className="text-cyan-300">{summary.planStatus}</span>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Version</span>

                <span className="text-neutral-300">{summary.planVersion}</span>
              </div>
            </article>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <article className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Tranche Posture
              </div>

              <dl className="mt-3 space-y-2 text-xs">
                {[
                  ["Total", summary.trancheCounts.total],
                  ["Planned", summary.trancheCounts.planned],
                  ["Eligible", summary.trancheCounts.eligible],
                  ["Ineligible", summary.trancheCounts.ineligible],
                  [
                    "Requires Clarification",
                    summary.trancheCounts.requiresClarification,
                  ],
                  [
                    "Bound to Execution",
                    summary.trancheCounts.boundToExecution,
                  ],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="flex justify-between gap-4"
                  >
                    <dt className="text-neutral-500">{label}</dt>

                    <dd className="text-neutral-200">{value}</dd>
                  </div>
                ))}
              </dl>
            </article>

            <article className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Execution Posture
              </div>

              <dl className="mt-3 space-y-2 text-xs">
                {[
                  ["Created", countExecution(summary, "CREATED")],
                  ["Authorized", countExecution(summary, "AUTHORIZED")],
                  ["Queued", countExecution(summary, "QUEUED")],
                  ["Initiated", countExecution(summary, "INITIATED")],
                  ["Confirmed", countExecution(summary, "CONFIRMED")],
                  ["Failed", countExecution(summary, "FAILED")],
                  [
                    "Requires Intervention",
                    countExecution(summary, "REQUIRES_INTERVENTION"),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="flex justify-between gap-4"
                  >
                    <dt className="text-neutral-500">{label}</dt>

                    <dd className="text-neutral-200">{value}</dd>
                  </div>
                ))}
              </dl>
            </article>

            <article className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Capital Posture
              </div>

              <dl className="mt-3 space-y-2 text-xs">
                {[
                  ["Planned", summary.amounts.planned],
                  ["Bound", summary.amounts.bound],
                  ["Confirmed", summary.amounts.confirmed],
                  ["Failed", summary.amounts.failed],
                  ["Remaining Unbound", summary.amounts.remainingUnbound],
                ].map(([label, money]) => (
                  <div
                    key={String(label)}
                    className="flex justify-between gap-4"
                  >
                    <dt className="text-neutral-500">{String(label)}</dt>

                    <dd className="text-right text-neutral-200">
                      {formatMoney(money as Money)}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          </div>

          <div className="flex flex-wrap justify-between gap-3 border-t border-neutral-800 pt-3 text-[10px] uppercase tracking-wide text-neutral-600">
            <span>Read Only</span>

            <span>
              Last observed {new Date(summary.lastUpdatedAt).toLocaleString()}
            </span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
