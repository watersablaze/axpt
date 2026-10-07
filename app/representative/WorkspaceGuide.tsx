"use client";

import { useState } from "react";
import canvas from "./workspace-canvas.module.css";

const movements = [
  {
    title: "Your Appointment",
    copy: "Your appointment records your formal relationship with French-Ward. Its status and effective date belong to that instrument. Appointment does not independently grant operative authority.",
    source: "Appointment Record",
  },
  {
    title: "Your Authority",
    copy: "Authority is separately recorded and evaluated. Consult the current register and the scope, conditions, and required approvals before undertaking representative activity.",
    source: "Authority Register",
  },
  {
    title: "Your Commercial Utility Pack",
    copy: "Your CUP brings together documentary materials released for your account. Viewing, personal download, presentation, and transmission are separately governed. Possession of a resource does not establish authority to use it on behalf of French-Ward.",
    source: "Commercial Utility Pack · Released resources",
  },
  {
    title: "Your Current Position",
    copy: "",
    source: "Current Step · Server-derived position",
  },
] as const;

export default function WorkspaceGuide({ position }: { position: string }) {
  const [step, setStep] = useState(0);
  const complete = step === 5;
  const movement = step > 0 && !complete ? movements[step - 1] : null;

  return (
    <section className={canvas.guide} aria-labelledby="guide-heading">
      <header className={canvas.guidePresence}>
        <svg className={canvas.guideMark} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <path d="M15 36V13h18v23M11 36h26M24 8v7M20 11h8" />
          <path d="M21 18h6v18h-6z" />
        </svg>
        <div>
          <p className={canvas.kicker}>Guide · French-Ward</p>
          <p className={canvas.guidePresenceLabel}>Reception & Orientation</p>
        </div>
      </header>
      <div key={step} className={canvas.guideMovement} aria-live="polite" aria-atomic="true">
        <p className={canvas.guideIndex}>
          {step === 0 ? "Reception" : complete ? "Orientation complete" : `${String(step).padStart(2, "0")} / 04`}
        </p>
        <h1 id="guide-heading" className={canvas.guideTitle}>
          {step === 0 ? "Welcome to French-Ward"
            : complete ? "Enter your workspace"
            : movement?.title}
        </h1>
        <p className={canvas.guideCopy}>
          {step === 0
            ? "This is your institutional environment for representation with French-Ward. Establish your current position, inspect your appointment and authority, and open the documentary materials released to you."
            : complete
              ? "Your workspace will develop with your Program standing, authority, and released resources. Return to Guide whenever you need to reorient."
              : step === 4 ? position : movement?.copy}
        </p>
        {movement ? (
          <p className={canvas.guideSource}>{movement.source}</p>
        ) : null}
      </div>

      <ol className={canvas.guideProgress} aria-label="Orientation progress">
        {movements.map((item, index) => (
          <li
            key={item.title}
            data-complete={step > index + 1 || complete}
            aria-current={step === index + 1 ? "step" : undefined}
          >
            <span aria-hidden="true" />
            <span className={canvas.visuallyHidden}>
              {item.title}{step > index + 1 || complete ? " · Complete" : ""}
            </span>
          </li>
        ))}
      </ol>

      <div className={canvas.guideActions}>
        {step > 0 ? (
          <button type="button" onClick={() => setStep(value => value - 1)}>
            ← Back
          </button>
        ) : null}
        {complete ? (
          <a href="#workspace-overview">Enter Workspace →</a>
        ) : (
          <button type="button" onClick={() => setStep(value => value + 1)}>
            {step === 0 ? "Begin Orientation →"
              : step === 4 ? "Complete Orientation →" : "Continue →"}
          </button>
        )}
      </div>
      <p className={canvas.guideFootnote}>
        Guide explains the environment. Institutional decisions remain governed by the underlying records.
      </p>
    </section>
  );
}
