"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import styles from "./GlobalMotherExperience.module.css";

type ExperienceStage = "gate" | "opening" | "framework";

type GlobalMotherExperienceProps = {
  enabled: boolean;
  children: ReactNode;
  recipient?: { name: string; institution: string; capacity: string } | null;
};

function Seal() {
  return (
    <div
      className={styles.seal}
      aria-hidden="true"
    >
      <span />
      <span />
      <span />
    </div>
  );
}

export function GlobalMotherExperience({
  enabled,
  children,
  recipient,
}: GlobalMotherExperienceProps) {
  const [stage, setStage] =
    useState<ExperienceStage>("gate");

  if (!enabled) {
    return <>{children}</>;
  }

  if (stage === "framework") {
    return (
      <div className={styles.frameworkField}>
        {children}
      </div>
    );
  }

  return (
    <main className={styles.experience}>
      <div
        className={styles.atmosphere}
        aria-hidden="true"
      />

      <div
        className={styles.axis}
        aria-hidden="true"
      />

      <header className={styles.utility}>
        <span>
          French-Ward / AXPT
        </span>

        <span>
          Private Institutional Environment
        </span>
      </header>

      {stage === "gate" ? (
        <section
          className={`${styles.stage} ${styles.gate}`}
          aria-labelledby="gm-gate-heading"
        >
          <div className={styles.gatePrelude}><Seal /></div>
          <p className={styles.stageKicker}>Global Mother · Institutional Framework</p>
          <h1 id="gm-gate-heading">Framework of Royal Custodianship, Restoration &amp; Global Trade</h1>
          <div className={styles.prepared}>
            <span>Prepared for</span>
            <h2>{recipient?.name ?? "Dr. Awulah Naanii Amon"}</h2>
            <p>{recipient?.institution ?? "ND Royal Ministry"}</p>
            <p>{recipient?.capacity ?? "Global Mother · Royal Council Representative"}</p>
          </div>
          <div className={styles.gateStatement}>
            <p>You are formally invited to review the proposed relationship and respond to its seven intentions.</p>
          </div>

          <button
            type="button"
            className={styles.primaryAction}
            onClick={() =>
              setStage("opening")
            }
          >
            Enter the Framework
          </button>

          <p className={styles.thresholdNotice}>
            Entering opens the Framework for review. It does not constitute agreement,
            confer authority, or execute an instrument.
          </p>
        </section>
      ) : null}

      {stage === "opening" ? (
        <section
          className={`${styles.stage} ${styles.openingFolio}`}
          aria-labelledby="gm-opening-heading"
        >
          <p className={styles.stageKicker}>Opening folio</p>

          <h1 id="gm-opening-heading">
            Your place in the deliberation.
          </h1>

          <p className={styles.folioLead}>
            Five articles introduce the relationship, custodianship, gold passage, restoration, and the path toward a proposed agreement.
          </p>
          <div className={styles.prepared}>
            <span>Prepared for</span>
            <h2>{recipient?.name ?? "Dr. Awulah Naanii Amon"}</h2>
            <p>{recipient?.institution ?? "ND Royal Ministry"}</p>
            <p>{recipient?.capacity ?? "Global Mother · Royal Council Representative"}</p>
          </div>

          <div className={styles.folioColumns}>
            <div>
              <span>Read</span>
              <p>Move through the five articles at your own pace. The article rail keeps your place.</p>
            </div>

            <div>
              <span>Respond</span>
              <p>
                Consider seven intentions, add clarification or revisions where needed, and review your responses before submitting.
              </p>
            </div>
          </div>

          <p className={styles.folioBoundary}>
            Reading and responding support deliberation. Specific obligations arise through expressly formed instruments.
          </p>

          <button
            type="button"
            className={styles.primaryAction}
            onClick={() => setStage("framework")}
          >
            Read the Framework
          </button>
        </section>
      ) : null}

      <blockquote className={styles.inscription}>“Nobility is not for sale.”<cite>Global Mother · Nubian Empress Omaedro II</cite></blockquote>
      <footer className={styles.footer}>
        <span>
          GM-KENYA-RCF-001
        </span>

        <span>
          Controlled institutional access
        </span>
      </footer>
    </main>
  );
}
