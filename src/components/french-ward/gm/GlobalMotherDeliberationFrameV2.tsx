"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import styles from "./GlobalMotherDeliberationFrameV2.module.css";
import { globalMotherV2Definition } from "@/domains/instruments/definitions/globalMotherV2Definition";

type Position = "AFFIRM" | "CLARIFY" | "REVISE" | "DECLINE";

const choices: { value: Position; label: string; meaning: string }[] = [
  { value: "AFFIRM", label: "Affirm", meaning: "This states our position" },
  { value: "CLARIFY", label: "Clarify", meaning: "Explain a point" },
  { value: "REVISE", label: "Propose revision", meaning: "Suggest wording" },
  { value: "DECLINE", label: "Decline", meaning: "Do not accept as stated" },
];

const sections = [
  { article: "I–II / Relationship & Authority", references: ["ALIGN-01", "ALIGN-02", "ALIGN-03"] },
  { article: "III / Economic Passage", references: ["ALIGN-04"] },
  { article: "IV / Restoration & Continuity", references: ["ALIGN-05", "ALIGN-06"] },
  { article: "V / Deliberation & Formation", references: ["ALIGN-07"] },
] as const;

const affirmations = sections.map(section => ({
  article: section.article,
  entries: globalMotherV2Definition.propositions
    .filter(item => (section.references as readonly string[]).includes(item.reference))
    .map(item => [item.reference, item.title, item.body] as const),
}));

type Receipt = {
  id: string;
  versionId: string;
  representedInstitution: string;
  representativeCapacity: string;
  recordedAt: string;
  positions: unknown;
};

type GlobalMotherDeliberationFrameV2Props = {
  enabled: boolean;
  instrumentReference: string;
  actorBound: boolean;
  children: ReactNode;
};

export function GlobalMotherDeliberationFrameV2({
  enabled,
  instrumentReference,
  actorBound,
  children,
}: GlobalMotherDeliberationFrameV2Props) {
  const [entered, setEntered] = useState(false);
  const registerRef = useRef<HTMLDivElement>(null);
  const entryRef = useRef<HTMLButtonElement>(null);
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [receiptState, setReceiptState] = useState<"loading" | "ready" | "error">(
    actorBound ? "loading" : "ready",
  );
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const submissionKey = useRef<string | null>(null);

  function acceptReceipt(value: Receipt) {
    setReceipt(value);
    if (!Array.isArray(value.positions)) return;
    const savedPositions: Record<string, Position> = {};
    const savedNotes: Record<string, string> = {};
    for (const item of value.positions) {
      if (!item || typeof item !== "object") continue;
      const row = item as { reference?: unknown; responseType?: unknown; note?: unknown };
      if (typeof row.reference !== "string" ||
          !choices.some(choice => choice.value === row.responseType)) continue;
      savedPositions[row.reference] = row.responseType as Position;
      if (typeof row.note === "string") savedNotes[row.reference] = row.note;
    }
    setPositions(savedPositions);
    setNotes(savedNotes);
  }

  useEffect(() => {
    if (!enabled || !actorBound) return;
    let cancelled = false;
    fetch("/french-ward/instruments/gm-kenya/respond-set", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Unable to verify the response record.");
        return response.json() as Promise<{ receipt: Receipt | null }>;
      })
      .then(payload => {
        if (cancelled) return;
        if (payload.receipt) acceptReceipt(payload.receipt);
        setReceiptState("ready");
      })
      .catch(() => { if (!cancelled) setReceiptState("error"); });
    return () => { cancelled = true; };
  }, [enabled, actorBound]);

  const entries = affirmations.reduce<Array<readonly [string, string, string]>>(
    (all, section) => {
      for (const entry of section.entries) all.push(entry);
      return all;
    },
    [],
  );
  const responded = entries.filter(([reference]) => Boolean(positions[reference])).length;
  const unanswered = entries.filter(([reference]) => !positions[reference]).length;
  const missingNotes = entries.filter(([reference]) =>
    positions[reference] && positions[reference] !== "AFFIRM" && !notes[reference]?.trim(),
  ).length;
  const forDiscussion = entries.filter(([reference]) =>
    positions[reference] && positions[reference] !== "AFFIRM",
  ).length;

  async function recordPositions() {
    if (!actorBound || receiptState !== "ready" || receipt || recording ||
        unanswered > 0 || missingNotes > 0) return;
    submissionKey.current ??= crypto.randomUUID();
    setRecording(true);
    setRecordError(null);
    try {
      const response = await fetch("/french-ward/instruments/gm-kenya/respond-set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionKey: submissionKey.current,
          positions: entries.map(([reference]) => ({
            reference, responseType: positions[reference],
            note: positions[reference] === "AFFIRM" ? null : notes[reference]?.trim(),
          })),
        }),
      });
      const payload = await response.json() as { ok?: boolean; receipt?: Receipt; error?: string };
      if (!response.ok || !payload.ok || !payload.receipt) {
        throw new Error(payload.error || "The response could not be recorded.");
      }
      acceptReceipt(payload.receipt);
    } catch (error) {
      setRecordError(error instanceof Error ? error.message : "The response could not be recorded.");
      setReceiptState("error");
    } finally {
      setRecording(false);
    }
  }

  function openRegister() {
    setEntered(true);
    requestAnimationFrame(() => {
      registerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      registerRef.current?.focus({ preventScroll: true });
    });
  }

  function closeRegister() {
    setEntered(false);
    requestAnimationFrame(() => {
      entryRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      entryRef.current?.focus({ preventScroll: true });
    });
  }

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <section
      className={styles.frame}
      aria-label="Deliberation and instrument formation"
    >
      {!entered ? <>
      <div className={styles.propositions}>
        <article>
          <span>INST-01 / Attributable deliberation</span>
          <h3>Let each response keep its source.</h3>
          <p>Each position and note keeps its source. Written, audio, documentary, and formal responses are received according to their nature; communication alone creates no authority.</p>
        </article>
        <article>
          <span>INST-02 / Instrument formation</span>
          <h3>Alignment opens the next formation step.</h3>
          <p>Sufficient alignment may open drafting of a proposed master agreement for AOTG–French-Ward, French-Ward–ND Royal Ministry, and shared three-party duties. Gold stays in its transaction dossier.</p>
        </article>
      </div>

      <div className={styles.formationPath} aria-label="From framework response to operative standing">
        <span>Response</span><span>Framework alignment</span><span>Master agreement drafting</span><span>Authority to bind</span><span>Operative conditions</span><span>Execution & evidence</span>
      </div>

      <div className={styles.folio}>
        <div className={styles.primary}>
          <header className={styles.threshold}>
            <span className={styles.status}>
              Framework Under Deliberation
            </span>

            <h3>
              Respond to the Framework.
            </h3>

            <p>
              Respond to seven intentions. Identify any point needing
              clarification or revision, then review the full response.
            </p>
          </header>

          <div className={styles.responseSpectrum}>
            <span>
              Recognized response forms
            </span>

            <p>
              Affirm · Clarify · Propose revision · Decline
            </p>
          </div>

          <div className={styles.entry}>
            <button ref={entryRef} type="button" className={styles.enterAction}
              onClick={openRegister}>
              Respond to the Framework
            </button>
          </div>
          <p className={styles.previewStatus}>{actorBound
            ? "Your positions are recorded only when you press Record seven positions and receive a receipt."
            : "Internal preview · Selections are not recorded."}</p>
        </div>

        <aside className={styles.record}>
          <div>
            <span>
              Instrument
            </span>

            <strong>
              {instrumentReference}
            </strong>
          </div>

          <div>
            <span>
              Participation
            </span>

            <strong>
              {actorBound
                ? "Version-bound participant"
                : "Read-only draft preview"}
            </strong>
          </div>

          <div className={styles.authorityNote}>
            <span>
              Authority
            </span>

            <p>
              {actorBound
                ? "Your seven positions become a response set only after the server records them and returns a receipt."
                : "This draft preview shows the V2 affirmations. Opening the register does not record a response."}
            </p>
          </div>
        </aside>
      </div>
      </> : (

        <div id="gm-v2-alignment-register" ref={registerRef} tabIndex={-1}
          className={styles.councilField} role="region" aria-label="Framework response register">
          <div className={styles.registerToolbar}>
            <button type="button" className={styles.backAction} onClick={closeRegister}>
              ← Back to Article V
            </button>
            <span>{actorBound ? "Framework response · issued V2" : "Framework response · internal preview"}</span>
          </div>
          <div className={styles.positionField}>
          <div className={styles.councilOpening}>
            <span>
              V2 alignment register · seven positions
            </span>

            <div>
              <strong>
                State your position on each intention.
              </strong>

              <p>
                Select one response per position. For clarification,
                revision, or decline, identify the specific point in a note.
              </p>
            </div>
          </div>

          <div className={styles.registerSurface}>
            {affirmations.map((section) => (
              <section className={styles.registerSection} key={section.article}>
                <h4>{section.article}</h4>
                {section.entries.map(([reference, title, statement]) => (
                  <article className={styles.registerEntry} key={reference}>
                    <div className={styles.entryIdentity}><span>{reference}</span><h5>{title}</h5></div>
                    <div className={styles.entryResponse}>
                      <p>{statement}</p>
                      <div className={styles.choiceGrid} role="group" aria-label={`Position on ${title}`}>
                        {choices.map(choice => (
                          <button type="button" key={choice.value}
                            className={`${styles.choice} ${positions[reference] === choice.value ? styles.choiceSelected : ""}`}
                            aria-pressed={positions[reference] === choice.value}
                            disabled={Boolean(receipt) || recording}
                            title={choice.meaning}
                            onClick={() => {
                              setPositions(current => ({ ...current, [reference]: choice.value }));
                              if (choice.value === "AFFIRM") {
                                setNotes(current => {
                                  const next = { ...current };
                                  delete next[reference];
                                  return next;
                                });
                              }
                            }}>
                            {choice.label}
                          </button>
                        ))}
                      </div>
                      {positions[reference] ? <small className={styles.choiceMeaning}>{choices.find(choice => choice.value === positions[reference])?.meaning}</small> : null}
                      {positions[reference] && positions[reference] !== "AFFIRM" ? (
                        <label className={styles.noteField}>
                          <span>{positions[reference] === "REVISE" ? "Proposed wording and reason · required" : positions[reference] === "CLARIFY" ? "Point requiring clarification · required" : "Reason for declining · required"}</span>
                          <textarea value={notes[reference] ?? ""} rows={3} maxLength={4000} required aria-required="true" disabled={Boolean(receipt) || recording}
                            placeholder="Name the specific point, condition, or wording."
                            onChange={event => setNotes(current => ({ ...current, [reference]: event.target.value }))} />
                        </label>
                      ) : null}
                    </div>
                  </article>
                ))}
              </section>
            ))}
          </div>
          </div>
          <div className={styles.registerSurface}>
            <div className={styles.recordMechanics} aria-live="polite">
              <strong>Review your response · {responded} of {entries.length} selected</strong>
              <p>{unanswered === 0 && missingNotes === 0
                ? "All seven positions have a response and any required notes."
                : `${unanswered} without a response · ${missingNotes} missing a required note.`}
                {" "}{forDiscussion > 0
                  ? `${forDiscussion} position${forDiscussion === 1 ? " remains" : "s remain"} for discussion; a complete response does not mean full alignment.`
                  : "Responses are ready for review in this preview."}</p>
              <ol className={styles.reviewList}>
                {entries.map(([reference, title]) => (
                  <li key={reference}><span>{reference} · {title}</span><strong>{!positions[reference] ? "Response needed" : positions[reference] !== "AFFIRM" && !notes[reference]?.trim() ? "Required note missing" : choices.find(choice => choice.value === positions[reference])?.label}</strong>{notes[reference] && positions[reference] !== "AFFIRM" ? <p>{notes[reference]}</p> : null}</li>
                ))}
              </ol>
              <div className={styles.reviewIdentity}>{actorBound
                ? "One act records all seven positions against your issued Framework version and verified capacity."
                : "Framework V2 preview · No response can be recorded here."}</div>
              {receipt ? (
                <div className={styles.receipt} role="status">
                  <strong>Response recorded</strong>
                  <span>Receipt {receipt.id} · {new Date(receipt.recordedAt).toLocaleString()}</span>
                  <span>{receipt.representedInstitution} · {receipt.representativeCapacity}</span>
                  <small>AXPT can now review these positions. This receipt does not itself bind an institution or open drafting.</small>
                </div>
              ) : (
                <>
                  <button className={styles.recordAction} type="button" onClick={recordPositions}
                    disabled={!actorBound || receiptState !== "ready" || recording || unanswered > 0 || missingNotes > 0}>
                    {recording ? "Recording…" : "Record seven positions"}
                  </button>
                  {receiptState === "error" ? <p role="alert">The record needs to be checked. Reload this page before trying again.</p> : null}
                  {recordError ? <p role="alert">{recordError}</p> : null}
                  <small>{actorBound
                    ? "The seven positions are saved together. You will receive a receipt after the record commits."
                    : "Preview only: selections and notes are not saved or sent."}</small>
                </>
              )}
            </div>
          </div>

          <div className={styles.formationBoundary}>
            <span>
              Formation boundary
            </span>

            <p>
              Framework alignment can support drafting the proposed
              master agreement. It does not grant new
              authority, execute an SPA, allocate gold, or
              satisfy the operative conditions for execution.
            </p>
          </div>
        </div>
      )}

      <div className={styles.doctrine}>
        <span>Article V / Principle</span>
        <p>Understanding must become attributable response before it becomes binding action.</p>
      </div>
    </section>
  );
}
