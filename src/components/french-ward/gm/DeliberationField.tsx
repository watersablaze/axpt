"use client";

import {
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import styles from "./DeliberationField.module.css";

type ResponseType =
  | "ACKNOWLEDGE"
  | "AFFIRM"
  | "CLARIFY"
  | "REVISE"
  | "DECLINE";

type CurrentResponse = {
  id: string;
  responseType:
    ResponseType;
  note: string | null;
  createdAt: string;
};

type DeliberationProposition = {
  id: string;
  reference: string;
  state: string;
  domain: string;
  title: string;
  body: string;
  ordinal: number;
  resolution:
    | "UNRESPONDED"
    | "RECEIVED"
    | "ALIGNED"
    | "CLARIFICATION_OPEN"
    | "REVISION_PENDING"
    | "NOT_ALIGNED";
  response: CurrentResponse | null;
};

type DeliberationSummary = {
  total: number;
  responded: number;
  unresponded: number;
  aligned: number;
  received: number;
  clarificationOpen: number;
  revisionPending: number;
  notAligned: number;
};

type DeliberationFieldProps = {
  instrumentReference: string;
  instrumentStatus: string;
  actorBound: boolean;
  propositions: DeliberationProposition[];
  summary: DeliberationSummary;
};

function readable(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

export function DeliberationField({
  instrumentReference,
  instrumentStatus,
  actorBound,
  propositions,
  summary,
}: DeliberationFieldProps) {
  const router =
    useRouter();

  const [selectedId, setSelectedId] =
    useState(
      propositions[0]?.id ?? "",
    );

  /*
   * These values are drafting state only.
   *
   * They do not represent institutional truth and
   * are never used to derive resolution, standing,
   * access, actor identity or response history.
   */
  const [
    draftResponseType,
    setDraftResponseType,
  ] =
    useState<ResponseType | null>(
      null,
    );

  const [
    draftNote,
    setDraftNote,
  ] =
    useState("");

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    submissionError,
    setSubmissionError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    submissionNotice,
    setSubmissionNotice,
  ] =
    useState<string | null>(
      null,
    );

  const selected =
    propositions.find(
      (proposition) =>
        proposition.id === selectedId,
    ) ??
    propositions[0] ??
    null;

  const unresolvedCount =
    summary.total -
    summary.aligned;

  function selectProposition(
    propositionId: string,
  ) {
    setSelectedId(
      propositionId,
    );

    /*
     * Moving between propositions clears only
     * unsubmitted drafting state.
     */
    setDraftResponseType(
      null,
    );
    setDraftNote("");
    setSubmissionError(
      null,
    );
    setSubmissionNotice(
      null,
    );
  }

  async function submitResponse() {
    if (
      !actorBound ||
      !selected ||
      !draftResponseType ||
      submitting
    ) {
      return;
    }

    setSubmitting(true);
    setSubmissionError(
      null,
    );
    setSubmissionNotice(
      null,
    );

    try {
      const response =
        await fetch(
          "/french-ward/instruments/gm-kenya/respond",
          {
            method:
              "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                propositionReference:
                  selected.reference,
                responseType:
                  draftResponseType,
                note:
                  draftNote,
              }),
          },
        );

      const payload:
        | {
            ok?: boolean;
            error?: string;
          }
        | null =
        await response
          .json()
          .catch(
            () => null,
          );

      if (
        !response.ok ||
        !payload?.ok
      ) {
        throw new Error(
          payload?.error ||
          "RESPONSE_SUBMISSION_FAILED",
        );
      }

      /*
       * No response record is installed into local
       * state. The server projection remains the
       * source of truth.
       */
      setDraftResponseType(
        null,
      );
      setDraftNote("");

      setSubmissionNotice(
        "Response recorded. Refreshing the institutional register.",
      );

      router.refresh();
    } catch (error) {
      console.error(
        "[DeliberationField] response submission failed",
        error,
      );

      setSubmissionError(
        "The response could not be recorded. Confirm controlled access and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className={styles.field}
      aria-label="Interactive institutional deliberation"
    >
      <div className={styles.fieldMeta}>
        <span>
          Deliberation Field 05
        </span>

        <span>
          {instrumentReference}
        </span>
      </div>

      <div className={styles.introduction}>
        <div>
          <span>
            Institutional Deliberation
          </span>

          <h3>
            The framework becomes actionable
            through attributable response.
          </h3>
        </div>

        <p>
          This register is projected from the
          durable AXPT institutional record.
          Proposition language, response standing
          and deliberative resolution are no longer
          maintained as browser-local institutional
          state.
        </p>
      </div>

      <div
        className={styles.summary}
        aria-label="Deliberation summary"
      >
        <article>
          <span>
            Total propositions
          </span>

          <strong>
            {summary.total}
          </strong>
        </article>

        <article>
          <span>
            Responses recorded
          </span>

          <strong>
            {summary.responded}
          </strong>
        </article>

        <article>
          <span>
            Unresolved positions
          </span>

          <strong>
            {unresolvedCount}
          </strong>
        </article>

        <article>
          <span>
            Instrument state
          </span>

          <strong>
            {readable(
              instrumentStatus,
            )}
          </strong>
        </article>
      </div>

      <div className={styles.workspace}>
        <div className={styles.register}>
          <div
            className={
              styles.registerHeader
            }
          >
            <span>
              Proposition Register
            </span>

            <small>
              Select a proposition to inspect
            </small>
          </div>

          <div
            className={
              styles.propositions
            }
          >
            {propositions.map(
              (proposition) => {
                const active =
                  proposition.id ===
                  selected?.id;

                return (
                  <button
                    key={
                      proposition.id
                    }
                    type="button"
                    className={`${
                      styles.proposition
                    } ${
                      active
                        ? styles.active
                        : ""
                    }`}
                    onClick={() =>
                      selectProposition(
                        proposition.id,
                      )
                    }
                  >
                    <div
                      className={
                        styles.propositionMeta
                      }
                    >
                      <span>
                        {
                          proposition.reference
                        }
                      </span>

                      <span>
                        {
                          proposition.state
                        }
                      </span>
                    </div>

                    <strong>
                      {
                        proposition.title
                      }
                    </strong>

                    <small>
                      {
                        proposition.domain
                      }
                    </small>

                    <div
                      className={
                        styles.responseMarker
                      }
                    >
                      {readable(
                        proposition.resolution,
                      )}
                    </div>
                  </button>
                );
              },
            )}
          </div>
        </div>

        <div
          className={
            styles.deliberator
          }
        >
          {selected ? (
            <>
              <div
                className={
                  styles.selectedMeta
                }
              >
                <span>
                  {selected.reference}
                </span>

                <span>
                  {selected.domain}
                </span>

                <span>
                  {selected.state}
                </span>
              </div>

              <h3>
                {selected.title}
              </h3>

              <p
                className={
                  styles.selectedBody
                }
              >
                {selected.body}
              </p>

              <div
                className={
                  styles.responseTypes
                }
              >
                <span>
                  Current resolution
                </span>

                <strong>
                  {readable(
                    selected.resolution,
                  )}
                </strong>
              </div>

              {selected.response ? (
                <div
                  className={
                    styles.noteField
                  }
                >
                  <span>
                    Current attributable
                    response
                  </span>

                  <strong>
                    {readable(
                      selected.response
                        .responseType,
                    )}
                  </strong>

                  <p>
                    {selected.response
                      .note ||
                      "No additional response note recorded."}
                  </p>
                </div>
              ) : (
                <div
                  className={
                    styles.localNotice
                  }
                >
                  <span>
                    No attributable
                    response
                  </span>

                  <p>
                    No current durable
                    response exists for
                    the deliberation
                    identity represented
                    by this view.
                  </p>
                </div>
              )}

              {actorBound ? (
                <div
                  className={
                    styles.responseComposer
                  }
                >
                  <div
                    className={
                      styles.responseComposerHeader
                    }
                  >
                    <div>
                      <span>
                        Record a position
                      </span>

                      <p>
                        Select the response that
                        best represents your
                        present institutional
                        position on this
                        proposition.
                      </p>
                    </div>

                    <small>
                      Attributable response
                    </small>
                  </div>

                  <div
                    className={
                      styles.responseActionGrid
                    }
                    role="group"
                    aria-label="Response type"
                  >
                    {(
                      [
                        "ACKNOWLEDGE",
                        "AFFIRM",
                        "CLARIFY",
                        "REVISE",
                        "DECLINE",
                      ] as ResponseType[]
                    ).map(
                      (
                        responseType,
                      ) => {
                        const active =
                          draftResponseType ===
                          responseType;

                        return (
                          <button
                            key={
                              responseType
                            }
                            type="button"
                            className={`${
                              styles.responseAction
                            } ${
                              active
                                ? styles.responseActionActive
                                : ""
                            }`}
                            aria-pressed={
                              active
                            }
                            disabled={
                              submitting
                            }
                            onClick={() => {
                              setDraftResponseType(
                                responseType,
                              );
                              setSubmissionError(
                                null,
                              );
                              setSubmissionNotice(
                                null,
                              );
                            }}
                          >
                            {readable(
                              responseType,
                            )}
                          </button>
                        );
                      },
                    )}
                  </div>

                  <label
                    className={
                      styles.responseNoteLabel
                    }
                  >
                    <span>
                      Response note
                    </span>

                    <small>
                      Optional supporting
                      context
                    </small>

                    <textarea
                      value={
                        draftNote
                      }
                      disabled={
                        submitting
                      }
                      rows={5}
                      maxLength={
                        4000
                      }
                      placeholder="Add clarification, conditions, revision language, or other context where useful."
                      onChange={(
                        event,
                      ) =>
                        setDraftNote(
                          event.target
                            .value,
                        )
                      }
                    />
                  </label>

                  {submissionError ? (
                    <p
                      className={
                        styles.submissionError
                      }
                      role="alert"
                    >
                      {
                        submissionError
                      }
                    </p>
                  ) : null}

                  {submissionNotice ? (
                    <p
                      className={
                        styles.submissionNotice
                      }
                      role="status"
                    >
                      {
                        submissionNotice
                      }
                    </p>
                  ) : null}

                  <div
                    className={
                      styles.responseComposerFooter
                    }
                  >
                    <p>
                      Submission creates an
                      attributable durable
                      response. A later response
                      preserves and supersedes
                      the prior position rather
                      than deleting it.
                    </p>

                    <button
                      type="button"
                      className={
                        styles.submitResponse
                      }
                      disabled={
                        !draftResponseType ||
                        submitting
                      }
                      onClick={() => {
                        void submitResponse();
                      }}
                    >
                      {submitting
                        ? "Recording..."
                        : selected.response
                          ? "Record revised position"
                          : "Record response"}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={
                    styles.localNotice
                  }
                >
                  <span>
                    Response submission
                  </span>

                  <p>
                    This view does not carry a
                    deliberation identity.
                    Controlled identity-bound
                    access is required before an
                    attributable response may be
                    recorded.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div
              className={
                styles.localNotice
              }
            >
              <span>
                No propositions
              </span>

              <p>
                The current instrument
                version contains no
                deliberation propositions.
              </p>
            </div>
          )}
        </div>
      </div>

      <div
        className={
          styles.responseLedger
        }
      >
        <div
          className={
            styles.responseLedgerHeader
          }
        >
          <span>
            Deliberation Ledger
          </span>

          <small>
            {summary.responded === 0
              ? "No attributable responses recorded"
              : `${
                  summary.responded
                } current response${
                  summary.responded === 1
                    ? ""
                    : "s"
                }`}
          </small>
        </div>

        {summary.responded === 0 ? (
          <p
            className={
              styles.emptyLedger
            }
          >
            Durable institutional
            responses will appear here
            after an identified
            deliberator records a
            position.
          </p>
        ) : (
          <div
            className={
              styles.ledgerRows
            }
          >
            {propositions
              .filter(
                (proposition) =>
                  proposition.response,
              )
              .map(
                (proposition) => (
                  <article
                    key={
                      proposition.id
                    }
                  >
                    <div>
                      <span>
                        {
                          proposition.reference
                        }
                      </span>

                      <strong>
                        {
                          proposition.title
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Response
                      </span>

                      <strong>
                        {readable(
                          proposition
                            .response!
                            .responseType,
                        )}
                      </strong>
                    </div>

                    <p>
                      {proposition
                        .response!
                        .note ||
                        "No additional response note recorded."}
                    </p>
                  </article>
                ),
              )}
          </div>
        )}
      </div>

      <div className={styles.doctrine}>
        <span>
          Deliberation Doctrine 05
        </span>

        <p>
          Agreement should emerge from
          visible propositions,
          attributable responses and
          preserved revision — not from
          silent assumptions.
        </p>
      </div>
    </section>
  );
}
