"use client";

import { globalMotherCycleV2Plan } from "@/domains/instruments/definitions/globalMotherCycleV2Plan";
import styles from "./page.module.css";
import { ChamberOrientationControl } from "./ChamberOrientationControl";

export function CycleV2PreparationPanel() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <div>
          <span>00 / Next cycle</span>
          <h2>Chamber V2 Preparation</h2>
        </div>
        <small>PREPARATION ONLY</small>
      </div>

      <p className={styles.sectionLead}>
        This surface records the next-cycle boundary before any new version,
        recipient grant, private link, or outbound communication is created.
      </p>

      <div className={styles.recipientList}>
        {globalMotherCycleV2Plan.participants.map((participant) => (
          <div className={styles.recipientItem} key={participant.key}>
            <div className={styles.recipientBody}>
              <strong>{participant.name}</strong>
              <span>
                {participant.institution} · {participant.capacity}
              </span>
              <small>
                {participant.participation} · Delivery: {participant.delivery}
              </small>
            </div>
          </div>
        ))}
      </div>

      <p className={styles.draftingBoundary}>
        Instrument storage version: V{globalMotherCycleV2Plan.storageVersion}.
        Chamber label: {globalMotherCycleV2Plan.cycleLabel}. Nama remains in
        the historical V1 record and is not included in the new-cycle roster.
        Friends of Farmers is recorded only as the Global Mother&apos;s delivery
        channel; no Chamber standing or deliberative authority is inferred.
      </p>

      <p className={styles.deliveryNotice}>
        V2 issuance disabled · V2 access delivery disabled · No V2 grants created
      </p>

      <ChamberOrientationControl />
    </section>
  );
}
