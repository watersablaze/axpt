"use client";

import { useMemo, useState } from "react";
import styles from "./DeliberationField.module.css";

type PropositionState =
  | "CONFIRMED"
  | "UNDERSTOOD"
  | "PROPOSED"
  | "OPEN";

type ResponseType =
  | "ACKNOWLEDGE"
  | "AFFIRM"
  | "CLARIFY"
  | "REVISE"
  | "DECLINE";

type Proposition = {
  id: string;
  reference: string;
  state: PropositionState;
  domain: string;
  title: string;
  body: string;
};

type ResponseRecord = {
  type: ResponseType;
  note: string;
};

const propositions: Proposition[] = [
  {
    id: "royal-standing",
    reference: "REL-01",
    state: "CONFIRMED",
    domain: "Relationship",
    title: "Royal standing",
    body:
      "The Great Mother’s Royal standing has been sufficiently established for the relationship to proceed in good faith.",
  },
  {
    id: "relational-opening",
    reference: "REL-02",
    state: "UNDERSTOOD",
    domain: "Relationship",
    title: "Relational economic opening",
    body:
      "The invitation is understood to join family relationship, lawful trade, restoration, projects and continuing return.",
  },
  {
    id: "custodial-role",
    reference: "AUTH-01",
    state: "PROPOSED",
    domain: "Authority",
    title: "French-Ward custodianship",
    body:
      "French-Ward is proposed as a custodial institutional partner operating through expressly defined delegated authority.",
  },
  {
    id: "reserved-authority",
    reference: "AUTH-02",
    state: "PROPOSED",
    domain: "Authority",
    title: "Reserved Royal authority",
    body:
      "Royal identity, recognition, symbols, appointments and final Royal representation remain under Royal authority unless expressly delegated.",
  },
  {
    id: "corridor-principle",
    reference: "PASS-01",
    state: "PROPOSED",
    domain: "Economic Corridor",
    title: "Governed passage",
    body:
      "Gold should progress only through an identified source, verified authority, controlled passage, qualified receiving gateway, assay and settlement.",
  },
  {
    id: "three-kilogram",
    reference: "PASS-02",
    state: "OPEN",
    domain: "Economic Corridor",
    title: "Three-kilogram provision",
    body:
      "The legal and economic character of the proposed three-kilogram / approximately USD 300,000 provision remains to be defined.",
  },
  {
    id: "digital-house",
    reference: "FUT-01",
    state: "PROPOSED",
    domain: "Future Body",
    title: "Royal Digital House",
    body:
      "French-Ward proposes the Royal Digital House as an inaugural institutional gift for heritage, identity, projects, governance and future digital-economic development.",
  },
  {
    id: "annual-return",
    reference: "FUT-02",
    state: "OPEN",
    domain: "Future Body",
    title: "Annual return and homage",
    body:
      "The principle of annual return is recognized while its ceremonial, project, service and economic dimensions remain to be jointly defined.",
  },
];

const responseTypes: ResponseType[] = [
  "ACKNOWLEDGE",
  "AFFIRM",
  "CLARIFY",
  "REVISE",
  "DECLINE",
];

function readableResponse(type: ResponseType) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

export function DeliberationField() {
  const [selectedId, setSelectedId] = useState(propositions[0].id);
  const [draftType, setDraftType] = useState<ResponseType>("ACKNOWLEDGE");
  const [draftNote, setDraftNote] = useState("");
  const [responses, setResponses] = useState<Record<string, ResponseRecord>>({});

  const selected =
    propositions.find((proposition) => proposition.id === selectedId) ??
    propositions[0];

  const respondedCount = Object.keys(responses).length;

  const unresolvedCount = useMemo(
    () =>
      propositions.filter(
        (proposition) =>
          proposition.state === "OPEN" &&
          responses[proposition.id]?.type !== "AFFIRM"
      ).length,
    [responses]
  );

  function selectProposition(id: string) {
    setSelectedId(id);

    const existing = responses[id];

    if (existing) {
      setDraftType(existing.type);
      setDraftNote(existing.note);
      return;
    }

    setDraftType("ACKNOWLEDGE");
    setDraftNote("");
  }

  function submitResponse() {
    setResponses((current) => ({
      ...current,
      [selected.id]: {
        type: draftType,
        note: draftNote.trim(),
      },
    }));
  }

  function clearResponse() {
    setResponses((current) => {
      const next = { ...current };
      delete next[selected.id];
      return next;
    });

    setDraftType("ACKNOWLEDGE");
    setDraftNote("");
  }

  return (
    <section
      className={styles.field}
      aria-label="Interactive institutional deliberation"
    >
      <div className={styles.fieldMeta}>
        <span>Deliberation Field 05</span>
        <span>GM-KENYA-RCF-001</span>
      </div>

      <div className={styles.introduction}>
        <div>
          <span>Institutional Deliberation</span>
          <h3>The framework becomes actionable through response.</h3>
        </div>

        <p>
          Each proposition is distinguished by its present institutional state.
          Responses do not silently alter the framework; they create a visible
          position from which clarification, revision and alignment can proceed.
        </p>
      </div>

      <div className={styles.summary} aria-label="Deliberation summary">
        <article>
          <span>Total propositions</span>
          <strong>{propositions.length}</strong>
        </article>

        <article>
          <span>Responses recorded</span>
          <strong>{respondedCount}</strong>
        </article>

        <article>
          <span>Open propositions</span>
          <strong>{unresolvedCount}</strong>
        </article>

        <article>
          <span>Instrument state</span>
          <strong>
            {respondedCount === propositions.length && unresolvedCount === 0
              ? "READY FOR ALIGNMENT"
              : "UNDER DELIBERATION"}
          </strong>
        </article>
      </div>

      <div className={styles.workspace}>
        <div className={styles.register}>
          <div className={styles.registerHeader}>
            <span>Proposition Register</span>
            <small>Select a proposition to deliberate</small>
          </div>

          <div className={styles.propositions}>
            {propositions.map((proposition) => {
              const response = responses[proposition.id];
              const active = proposition.id === selected.id;

              return (
                <button
                  key={proposition.id}
                  type="button"
                  className={`${styles.proposition} ${
                    active ? styles.active : ""
                  }`}
                  onClick={() => selectProposition(proposition.id)}
                >
                  <div className={styles.propositionMeta}>
                    <span>{proposition.reference}</span>
                    <span>{proposition.state}</span>
                  </div>

                  <strong>{proposition.title}</strong>

                  <small>{proposition.domain}</small>

                  {response ? (
                    <div className={styles.responseMarker}>
                      {readableResponse(response.type)}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.deliberator}>
          <div className={styles.selectedMeta}>
            <span>{selected.reference}</span>
            <span>{selected.domain}</span>
            <span>{selected.state}</span>
          </div>

          <h3>{selected.title}</h3>

          <p className={styles.selectedBody}>{selected.body}</p>

          <fieldset className={styles.responseTypes}>
            <legend>Institutional response</legend>

            {responseTypes.map((type) => (
              <label key={type}>
                <input
                  type="radio"
                  name="deliberation-response"
                  value={type}
                  checked={draftType === type}
                  onChange={() => setDraftType(type)}
                />

                <span>{readableResponse(type)}</span>
              </label>
            ))}
          </fieldset>

          <label className={styles.noteField}>
            <span>Response note</span>

            <textarea
              value={draftNote}
              onChange={(event) => setDraftNote(event.target.value)}
              placeholder={
                draftType === "CLARIFY"
                  ? "State the clarification required…"
                  : draftType === "REVISE"
                    ? "State the proposed revision…"
                    : draftType === "DECLINE"
                      ? "State the reason or boundary…"
                      : "Optional institutional note…"
              }
              rows={6}
            />
          </label>

          <div className={styles.actions}>
            <button type="button" onClick={submitResponse}>
              Record response
            </button>

            {responses[selected.id] ? (
              <button
                type="button"
                className={styles.secondaryAction}
                onClick={clearResponse}
              >
                Clear response
              </button>
            ) : null}
          </div>

          <div className={styles.localNotice}>
            <span>V1 interaction state</span>
            <p>
              Responses are presently held in this browser session only. They
              are not yet written to the AXPT institutional record.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.responseLedger}>
        <div className={styles.responseLedgerHeader}>
          <span>Deliberation Ledger</span>
          <small>
            {respondedCount === 0
              ? "No responses recorded"
              : `${respondedCount} response${
                  respondedCount === 1 ? "" : "s"
                } recorded`}
          </small>
        </div>

        {respondedCount === 0 ? (
          <p className={styles.emptyLedger}>
            Institutional responses will appear here as propositions are
            deliberated.
          </p>
        ) : (
          <div className={styles.ledgerRows}>
            {propositions
              .filter((proposition) => responses[proposition.id])
              .map((proposition) => {
                const response = responses[proposition.id];

                return (
                  <article key={proposition.id}>
                    <div>
                      <span>{proposition.reference}</span>
                      <strong>{proposition.title}</strong>
                    </div>

                    <div>
                      <span>Response</span>
                      <strong>{readableResponse(response.type)}</strong>
                    </div>

                    <p>
                      {response.note || "No additional response note recorded."}
                    </p>
                  </article>
                );
              })}
          </div>
        )}
      </div>

      <div className={styles.doctrine}>
        <span>Deliberation Doctrine 05</span>

        <p>
          Agreement should emerge from visible propositions, attributable
          responses and preserved revision — not from silent assumptions.
        </p>
      </div>
    </section>
  );
}
