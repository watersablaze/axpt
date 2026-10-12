"use client";

import { globalMotherCycleV2Plan } from "@/domains/instruments/definitions/globalMotherCycleV2Plan";
import styles from "./page.module.css";
import { ChamberOrientationControl } from "./ChamberOrientationControl";

const participantPresentation = {
  KHAN_KHAN: {
    name: "Khan-Khan",
    institution: "AOTG",
    delivery: "Direct",
  },
  GLOBAL_MOTHER: {
    name: "Empress Omaedro II",
    institution: "ND Royal Ministry",
    delivery: "via Friends of Farmers",
  },
  FRENCH_WARD: {
    name: "Jamal James Ward",
    institution: "French-Ward, Inc.",
    delivery: "Internal",
  },
} as const;

export function CycleV2PreparationPanel() {
  return (
    <section className={`${styles.section} ${styles.cyclePreparationSection}`}>
      <div className={styles.sectionHeading}>
        <div>
          <span>00 / Next cycle</span>
          <h2>Chamber V2 Preparation</h2>
        </div>
        <small>PREPARATION ONLY</small>
      </div>

      <div className={styles.cycleStatusStrip}>
        <span>V{globalMotherCycleV2Plan.storageVersion}</span>
        <span>{globalMotherCycleV2Plan.cycleLabel}</span>
        <span>Issuance disabled</span>
        <span>Access disabled</span>
        <span>No V2 grants</span>
      </div>

      <p className={styles.sectionLead}>
        Next-cycle preparation only. No new version, recipient grant, private
        link, or Chamber access has been issued.
      </p>

      <div className={styles.cycleRoster}>
        {globalMotherCycleV2Plan.participants.map((participant) => {
          const presentation = participantPresentation[participant.key];

          return (
            <div
              className={styles.cycleRosterItem}
              key={participant.key}
              title={participant.name}
            >
              <strong>{presentation.name}</strong>
              <span>{presentation.institution}</span>
              <small>
                {participant.participation} · {presentation.delivery}
              </small>
            </div>
          );
        })}
      </div>

      <p className={styles.cycleBoundary}>
        Historical V1 participation remains preserved. Friends of Farmers serves
        as the Empress&apos;s designated delivery channel for this cycle; no
        Chamber standing or deliberative authority is inferred.
      </p>

      <div className={styles.preChamberLabel}>
        <span>Pre-Chamber Communication</span>
      </div>

      <ChamberOrientationControl />
    </section>
  );
}
