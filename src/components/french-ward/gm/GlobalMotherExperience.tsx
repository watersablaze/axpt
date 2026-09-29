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
          <div className={styles.gatePrelude}>
            <p>
              Private Institutional Environment
            </p>

            <Seal />
          </div>

          <div className={styles.prepared}>
            <span>
              Prepared for
            </span>

            <h1 id="gm-gate-heading">
              {recipient?.name ?? "Dr. Awulah Naanii Amon"}
            </h1>

            <p>
              {recipient?.institution ?? "Nubian Empress Omaedro II"}
            </p>

            <div className={styles.capacities}>
              <span>
                {recipient?.capacity ?? "Global Mother"}
              </span>

              <span>
                {recipient?.institution ?? "Royal Council Representative"}
              </span>
            </div>
          </div>

          <div className={styles.gateStatement}>
            <p>
              You have been received into a private,
              access-controlled institutional environment
              prepared for the development of this
              relationship.
            </p>

            <p>
              Your access is personal and attributable.
              Materials presented within this environment
              are reserved for invited participants and
              authorized institutional custodians
              associated with this Framework.
            </p>
          </div>

          <div
            className={styles.accessDoctrine}
            aria-label="Access characteristics"
          >
            <span>Private</span>
            <span>Invitation-bound</span>
            <span>Attributable</span>
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
            Entry permits review of the Framework.
            It does not by itself constitute agreement,
            delegation of authority, commercial
            commitment, or execution.
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
            {recipient
              ? `French-Ward receives ${recipient.name} in the presented capacity of ${recipient.capacity} for ${recipient.institution}.`
              : "French-Ward receives Dr. Awulah Naanii Amon, known as Nubian Empress Omaedro II and also as Gloria Amon-Vanderpuije, in the capacities presented as Global Mother and Royal Council Representative."}
          </p>

          <div className={styles.folioColumns}>
            <div>
              <span>Recognition</span>
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
