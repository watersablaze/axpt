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
            <p>This private chamber presents the Global Mother Framework for your review.
              Within it, you may consider the proposed relationship and record your positions
              through the response register.</p>
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
            The relationship comes first.
          </h1>

          <p className={styles.folioLead}>
            French-Ward receives you in the capacities presented for this relationship.
          </p>
          <div className={styles.prepared}>
            <span>Presented participant</span>
            <h2>{recipient?.name ?? "Dr. Awulah Naanii Amon"}</h2>
            <p>{recipient?.institution ?? "ND Royal Ministry"}</p>
            <p>{recipient?.capacity ?? "Global Mother · Royal Council Representative"}</p>
          </div>

          <div className={styles.folioColumns}>
            <div>
              <span>Presented capacities</span>
              <p>
                This reception records the presented capacities.
                It does not independently confer or adjudicate Royal
                title, standing, sovereignty, lineage, or internal authority.
              </p>
            </div>

            <div>
              <span>Purpose</span>
              <p>
                The Framework provides a place for relationship,
                responsible passage, restoration, continuity, and
                attributable deliberation to develop.
              </p>
            </div>
          </div>

          <p className={styles.folioBoundary}>
            Recognition does not establish authority. Access and silence
            do not create agreement. Specific obligations arise only
            through expressly formed instruments.
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
