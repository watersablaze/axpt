"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import { createPortal } from "react-dom";

import styles from "./GlobalMotherDeliberationFrameV2.module.css";
import { globalMotherV3Definition } from "@/domains/instruments/definitions/globalMotherV3Definition";

type Position = "AFFIRM" | "CLARIFY" | "REVISE" | "DECLINE";

const choices: { value: Position; label: string; meaning: string }[] = [
  { value: "AFFIRM", label: "Affirm", meaning: "This reflects my position." },
  { value: "CLARIFY", label: "Clarify", meaning: "I need a point explained." },
  { value: "REVISE", label: "Propose revision", meaning: "I suggest different wording or scope." },
  { value: "DECLINE", label: "Decline", meaning: "This does not reflect my position." },
];

const sections = [
  { article: "I–II / Relationship & Authority", references: ["ALIGN-01", "ALIGN-02", "ALIGN-03"] },
  { article: "III / Economic Passage", references: ["ALIGN-04"] },
  { article: "IV / Restoration & Continuity", references: ["ALIGN-05", "ALIGN-06"] },
  { article: "V / Deliberation & Formation", references: ["ALIGN-07", "ALIGN-08"] },
] as const;

const affirmations = sections.map(section => ({
  article: section.article,
  entries: globalMotherV3Definition.propositions
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
  const [activePosition, setActivePosition] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
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
    setReviewing(true);
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
      focusHeading();
    } catch (error) {
      setRecordError(error instanceof Error ? error.message : "The response could not be recorded.");
      setReceiptState("error");
    } finally {
      setRecording(false);
    }
  }

  const activeEntry = entries[activePosition];
  const [reference, title, statement] = activeEntry;
  const activeComplete = Boolean(positions[reference]) &&
    (positions[reference] === "AFFIRM" || Boolean(notes[reference]?.trim()));
  const completed = entries.filter(([ref]) => positions[ref] &&
    (positions[ref] === "AFFIRM" || Boolean(notes[ref]?.trim()))).length;
  const locked = Boolean(receipt) || recording || receiptState === "loading";

  function focusHeading() {
    requestAnimationFrame(() => {
      registerRef.current?.scrollTo({ top: 0, behavior: "instant" });
      headingRef.current?.focus({ preventScroll: true });
    });
  }

  function visitPosition(index: number) {
    setActivePosition(index);
    setReviewing(false);
    focusHeading();
  }

  function openRegister() {
    setEntered(true);
    focusHeading();
  }

  function closeRegister() {
    if (recording) return;
    setEntered(false);
    requestAnimationFrame(() => {
      entryRef.current?.scrollIntoView({ block: "center" });
      entryRef.current?.focus({ preventScroll: true });
    });
  }

  async function checkRecord() {
    setReceiptState("loading");
    setRecordError(null);
    try {
      const response = await fetch("/french-ward/instruments/gm-kenya/respond-set", { cache: "no-store" });
      if (!response.ok) throw new Error("The response record could not be checked.");
      const payload = await response.json() as { receipt: Receipt | null };
      if (payload.receipt) acceptReceipt(payload.receipt);
      setReceiptState("ready");
    } catch {
      setReceiptState("error");
    }
  }

  // The register is a separate portal. Keep the underlying article out of the
  // keyboard and accessibility navigation until the participant returns to it.
  useEffect(() => {
    if (!entered) return;
    const portal = registerRef.current;
    const previousOverflow = document.body.style.overflow;
    const siblings = Array.from(document.body.children)
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== portal);
    const previousInert = siblings.map(element => element.inert);
    siblings.forEach(element => { element.inert = true; });
    document.body.style.overflow = "hidden";
    function trapFocus(event: KeyboardEvent) {
      if (event.key !== "Tab") return;
      const targets = portal?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
      );
      if (!targets?.length) { event.preventDefault(); return; }
      const first = targets[0];
      const last = targets[targets.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === first || !Array.from(targets).includes(current as HTMLElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (current === last || !Array.from(targets).includes(current as HTMLElement))) {
        event.preventDefault(); first.focus();
      }
    }
    document.addEventListener("keydown", trapFocus);
    return () => {
      document.body.style.overflow = previousOverflow;
      siblings.forEach((element, index) => { element.inert = previousInert[index]; });
      document.removeEventListener("keydown", trapFocus);
    };
  }, [entered]);

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
          <span>INST-01 / Your recorded response</span>
          <h3>Your response stays with your name.</h3>
          <p>Your eight positions and any notes are recorded with your verified recipient identity and represented capacity. Review them before submitting; a receipt confirms they have been received.</p>
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
              Respond to eight intentions. Identify any point needing
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
            ? "Your positions are recorded only when you submit the full response and receive a receipt."
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
                ? "Authorized participant"
                : "Read-only preview"}
            </strong>
          </div>

          <div className={styles.authorityNote}>
            <span>
              Authority
            </span>

            <p>
              {actorBound
                ? "Your eight positions are recorded together when you submit. A receipt confirms they have been received."
                : "Responses are not recorded from this view."}
            </p>
          </div>
        </aside>
      </div>
      </> : createPortal(
        <div id="gm-v2-alignment-register" ref={registerRef} tabIndex={-1}
          className={styles.councilField} role="dialog" aria-modal="true"
          aria-labelledby="gm-response-heading" aria-describedby="gm-response-status">
          <div className={styles.portalInner}>
            <aside className={styles.registerRail} aria-label="Deliberation guide">
            <div className={styles.registerToolbar}>
              <button type="button" className={styles.backAction} onClick={closeRegister} disabled={recording}>
                ← Return to Article V
              </button>
              <span>Global Mother · Deliberation</span>
            </div>

            <header className={styles.councilOpening}>
              <span>{receipt ? "Recorded response" : "Your response register"}</span>
              <h2 id="gm-response-heading" ref={reviewing && !receipt ? headingRef : undefined} tabIndex={-1}>
                {reviewing ? receipt ? "Response receipt." : "Review your responses." : "Consider each intention."}
              </h2>
              <p>{reviewing
                ? receipt ? "These are the eight positions held in your response receipt."
                  : "Check your eight positions and notes. You can return to any position before submitting."
                : "Choose the response that reflects your position. You can revisit any intention before submitting."}</p>
              <p id="gm-response-status" className={styles.draftStatus} role="status">
                {receipt ? "Recorded · Receipt received"
                  : receiptState === "loading" ? "Checking for an existing response…"
                  : actorBound ? "Not submitted · Choices stay on this page until you submit. Reloading clears unsubmitted choices."
                  : "Internal preview · Choices are not saved or sent."}
              </p>
            </header>

            <nav className={styles.positionNavigator} aria-label="Eight response positions">
              {entries.map(([ref, entryTitle], index) => {
                const complete = Boolean(positions[ref]) &&
                  (positions[ref] === "AFFIRM" || Boolean(notes[ref]?.trim()));
                return <button key={ref} type="button" disabled={recording || receiptState === "loading"}
                  className={`${styles.positionStep} ${!reviewing && activePosition === index ? styles.positionStepActive : ""}`}
                  aria-current={!reviewing && activePosition === index ? "step" : undefined}
                  aria-label={`Position ${index + 1}: ${entryTitle}. ${complete ? receipt ? "Recorded" : "Ready for review" : positions[ref] ? "Note needed" : "Response needed"}`}
                  onClick={() => visitPosition(index)}>
                  <span>{index + 1}</span><small>{complete ? "✓" : "·"}</small>
                </button>;
              })}
              <button type="button" className={`${styles.reviewStep} ${reviewing ? styles.positionStepActive : ""}`}
                disabled={recording || receiptState === "loading"}
                aria-current={reviewing ? "step" : undefined}
                onClick={() => { setReviewing(true); focusHeading(); }}>Review</button>
            </nav>
            <p className={styles.progressCaption}>{completed} of {entries.length} positions {receipt ? "recorded" : "ready for review"}</p>

            </aside>
            <div className={styles.registerContent}>
            {!reviewing ? (
              <article className={styles.positionCard} key={reference}>
                <span className={styles.positionEyebrow}>Position {activePosition + 1} of {entries.length} · {reference}</span>
                <h3 ref={headingRef} tabIndex={-1}>{title}</h3>
                <p className={styles.positionStatement}>{reference === "ALIGN-06" ? <>French-Ward intends a two-part Gift for AOTG and ND Royal Ministry:<span className={styles.giftPart}>(1) a digital tokenization pathway;</span><span className={styles.giftPart}>(2) a digital media management, design, and development package.</span><span className={styles.giftClose}>The recipients will help shape each part.</span></> : statement.split("\n\n").map((part, index) => <span className={styles.giftClose} key={index}>{part}</span>)}</p>
                <fieldset className={styles.responseField}>
                  <legend>Choose one response</legend>
                  <div className={styles.choiceGrid}>
                    {choices.map(choice => {
                      const selected = positions[reference] === choice.value;
                      return <button type="button" key={choice.value}
                        className={`${styles.choice} ${selected ? styles.choiceSelected : ""}`}
                        aria-pressed={selected} aria-label={choice.label}
                        aria-describedby={`${reference}-${choice.value}-meaning`} disabled={locked}
                        onClick={() => {
                          setPositions(current => ({ ...current, [reference]: choice.value }));
                          if (choice.value === "AFFIRM") {
                            setNotes(current => {
                              const next = { ...current }; delete next[reference]; return next;
                            });
                          }
                        }}>
                        <span className={styles.choiceLabel}>{choice.label}<span aria-hidden="true">{selected ? "✓" : ""}</span></span>
                        <span id={`${reference}-${choice.value}-meaning`} className={styles.choiceDescription}>{choice.meaning}</span>
                      </button>;
                    })}
                  </div>
                </fieldset>
                {positions[reference] && positions[reference] !== "AFFIRM" ? (
                  <label className={styles.noteField}>
                    <span>{positions[reference] === "REVISE" ? "Proposed wording and reason" : positions[reference] === "CLARIFY" ? "Point requiring clarification" : "Reason for declining"} <small>Required</small></span>
                    <textarea value={notes[reference] ?? ""} rows={4} maxLength={4000}
                      required aria-required="true" disabled={locked}
                      placeholder="Name the specific point, condition, or wording."
                      onChange={event => setNotes(current => ({ ...current, [reference]: event.target.value }))} />
                    <small>Your note will accompany this position in the submitted response.</small>
                  </label>
                ) : null}
                <div className={styles.positionActions}>
                  <button type="button" className={styles.backAction} disabled={activePosition === 0 || recording}
                    onClick={() => visitPosition(activePosition - 1)}>Previous</button>
                  <button type="button" className={styles.continueAction}
                    disabled={recording || receiptState === "loading" || !activeComplete}
                    onClick={() => {
                      if (activePosition < entries.length - 1) visitPosition(activePosition + 1);
                      else { setReviewing(true); focusHeading(); }
                    }}>{activePosition === entries.length - 1 ? "Review responses" : "Continue"} →</button>
                </div>
                {!activeComplete ? <p className={styles.completionHint}>
                  {!positions[reference] ? "Select a response to continue." : "Add the required note to continue."}
                </p> : null}
              </article>
            ) : (
              <section className={`${styles.reviewPanel} ${receipt ? styles.recordedPanel : ""}`} aria-label="Review all eight responses">
                {receipt ? <div className={styles.receipt} role="status">
                  <span className={styles.receiptSeal} aria-hidden="true">✓</span>
                  <span>Global Mother · Framework Response</span>
                  <h3 ref={headingRef} tabIndex={-1}>Your response is recorded.</h3>
                  <p>Eight positions received. Your deliberation now has its place in the institutional record.</p>
                  <dl><div><dt>Receipt</dt><dd>{receipt.id}</dd></div><div><dt>Recorded</dt><dd>{new Date(receipt.recordedAt).toLocaleString()}</dd></div><div><dt>Institution</dt><dd>{receipt.representedInstitution}</dd></div><div><dt>Capacity</dt><dd>{receipt.representativeCapacity}</dd></div></dl>
                  <small>This receipt records your response. It does not itself bind an institution or open drafting.</small>
                </div> : <div className={styles.reviewIntro}><span>Before submission</span><h3>Eight intentions. One considered response.</h3><p>Review every position and note below. Edit any entry before submitting.</p></div>}
                <ol className={styles.reviewList}>
                  {entries.map(([ref, entryTitle, entryStatement], index) => (
                    <li key={ref}>
                      <div className={styles.reviewRow}>
                        <span>{index + 1}. {entryTitle}</span>
                        <button type="button" className={styles.editAction} disabled={recording}
                          aria-label={`${receipt ? "View" : "Edit"} position ${index + 1}: ${entryTitle}`}
                          onClick={() => visitPosition(index)}>{receipt ? "View" : "Edit"}</button>
                      </div>
                      {!receipt ? <p className={styles.reviewStatement}>{ref === "ALIGN-06" ? <>French-Ward intends a two-part Gift for AOTG and ND Royal Ministry:<span className={styles.giftPart}>(1) a digital tokenization pathway;</span><span className={styles.giftPart}>(2) a digital media management, design, and development package.</span><span className={styles.giftClose}>The recipients will help shape each part.</span></> : entryStatement.split("\n\n").map((part, index) => <span className={styles.giftClose} key={index}>{part}</span>)}</p> : null}
                      <strong>{!positions[ref] ? "Response needed" : positions[ref] !== "AFFIRM" && !notes[ref]?.trim()
                        ? "Required note missing" : choices.find(choice => choice.value === positions[ref])?.label}</strong>
                      {!receipt && notes[ref] && positions[ref] !== "AFFIRM" ? <p className={styles.reviewNote}>{notes[ref]}</p> : null}
                    </li>
                  ))}
                </ol>
                <div className={styles.recordMechanics}>
                  <p>{unanswered === 0 && missingNotes === 0
                    ? "All eight positions have a response and any required notes."
                    : `${unanswered} without a response · ${missingNotes} missing a required note.`}
                    {" "}{forDiscussion > 0 ? `${forDiscussion} position${forDiscussion === 1 ? " remains" : "s remain"} for discussion; a complete response does not mean full alignment.` : ""}</p>
                  {receipt ? null : (
                    <>
                      <p className={styles.reviewIdentity}>{actorBound
                        ? "Submitting records all eight positions together against your issued Framework version and verified capacity. You will receive a receipt once recording is complete."
                        : "Preview only · No response can be recorded here."}</p>
                      <button className={styles.recordAction} type="button" onClick={recordPositions}
                        disabled={!actorBound || receiptState !== "ready" || recording || unanswered > 0 || missingNotes > 0}>
                        {recording ? "Submitting responses…" : "Submit responses"}
                      </button>
                    </>
                  )}
                </div>
              </section>
            )}

            {receiptState === "error" ? <div className={styles.errorState} role="alert">
              <p>{recordError ? "Submission could not be confirmed. Your choices remain on this page." : "The existing response record could not be checked."}
                {" "}Check the record before trying to submit.</p>
              <button className={styles.backAction} type="button" onClick={checkRecord}>Check response record</button>
            </div> : null}
            <footer className={styles.formationBoundary}>
              <span>{instrumentReference}</span>
              <p>Your response informs further deliberation and any proposed agreement.
                It does not by itself create binding authority.</p>
            </footer>
            </div>
          </div>
        </div>, document.body,
      )}

      {!entered ? <div className={styles.doctrine}>
        <span>Article V / Principle</span>
        <p>Understanding must become attributable response before it becomes binding action.</p>
      </div> : null}
    </section>
  );
}
