"use client";

import { useState } from "react";
import canvas from "./workspace-canvas.module.css";

const movements = [
  {
    title: "Your Appointment",
    copy: "Your appointment defines your role with French-Ward. Read your commercial mandate, review its scope and conditions, and confirm your acceptance when you are ready.",
    source: "Appointment Record",
  },
  {
    title: "Your Scope of Activity",
    copy: "Your Authority Register shows the activities currently available to you and their conditions. Use it as a practical reference when introducing relationships, communicating approved information, presenting materials, or coordinating engagement.",
    source: "Authority Register",
  },
  {
    title: "Your Commercial Utility Pack",
    copy: "Your Commercial Utility Pack keeps your official materials together. Open each resource to get acquainted with its content. The controls and use conditions show whether you can view, download, present, or share it. Sharing tools will appear as they become available.",
    source: "Commercial Utility Pack · Released resources",
  },
  {
    title: "Your Next Step",
    copy: "",
    source: "Overview · Your next step",
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
            ? "Welcome to your working environment with French-Ward. Here you can review your appointment, get acquainted with official materials, and find the scope and guidance for your representative work."
            : complete
              ? "Start with your appointment and materials, then return to Overview for your next step. Your workspace will grow with new resources and tools. We welcome your feedback as you begin using it."
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
        Use official materials as issued. Bring commercial terms and commitments to French-Ward for authorization.
      </p>
    </section>
  );
}
