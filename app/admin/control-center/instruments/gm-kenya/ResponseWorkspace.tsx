"use client";

import { useMemo, useState } from "react";

import styles from "./page.module.css";

type Position = Readonly<{
  reference: string;
  responseType: string;
  note: string | null;
}>;

type ResponseRecord = Readonly<{
  id: string;
  recordedAt: string;
  representedInstitution: string;
  representativeCapacity: string;
  actor: string;
  positions: readonly Position[];
}>;

export type ResponseIndexEntry = Readonly<{
  grantId: string;
  recipientName: string;
  representedInstitution: string;
  representativeCapacity: string;
  lifecycle: string;
  response: ResponseRecord | null;
}>;

export function ResponseWorkspace({
  entries,
  standing,
}: {
  entries: readonly ResponseIndexEntry[];
  standing: Readonly<{
    affirm: number;
    revise: number;
    decline: number;
    clarify: number;
  }>;
}) {
  const responseIds = useMemo(
    () =>
      entries
        .filter((entry) => entry.response)
        .map((entry) => entry.grantId),
    [entries],
  );

  const [openIds, setOpenIds] = useState<readonly string[]>([]);

  function setEntryOpen(grantId: string, open: boolean) {
    setOpenIds((current) => {
      if (open) {
        return current.includes(grantId)
          ? current
          : [...current, grantId];
      }

      return current.filter((id) => id !== grantId);
    });
  }

  return (
    <div className={styles.responseWorkspace}>
      <div className={styles.responseWorkspaceHeader}>
        <div className={styles.responseStanding}>
          <span>AFFIRM {standing.affirm}</span>
          <span>REVISE {standing.revise}</span>
          <span>DECLINE {standing.decline}</span>
          <span>CLARIFY {standing.clarify}</span>
        </div>

        <div
          className={styles.responseDisclosureActions}
          aria-label="Response disclosure controls"
        >
          <button
            type="button"
            disabled={responseIds.length === 0}
            onClick={() => setOpenIds(responseIds)}
          >
            Open All
          </button>

          <button
            type="button"
            disabled={openIds.length === 0}
            onClick={() => setOpenIds([])}
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className={styles.responseIndex}>
        {entries.map((entry) => {
          const response = entry.response;
          const isOpen = openIds.includes(entry.grantId);

          if (!response) {
            return (
              <article
                key={entry.grantId}
                className={`${styles.responseIndexItem} ${styles.responsePending}`}
              >
                <div className={styles.responseIndexIdentity}>
                  <div>
                    <strong>{entry.recipientName}</strong>
                    <span>
                      {entry.representedInstitution} ·{" "}
                      {entry.representativeCapacity}
                    </span>
                  </div>

                  <small>NO RESPONSE SUBMITTED</small>
                </div>

                <p>
                  Current access standing: {entry.lifecycle}. No attributable V4
                  response set is presently recorded for this recipient.
                </p>
              </article>
            );
          }

          return (
            <details
              key={entry.grantId}
              className={styles.responseIndexItem}
              open={isOpen}
              onToggle={(event) =>
                setEntryOpen(entry.grantId, event.currentTarget.open)
              }
            >
              <summary className={styles.responseIndexSummary}>
                <div className={styles.responseIndexIdentity}>
                  <div>
                    <strong>{entry.recipientName}</strong>
                    <span>
                      {entry.representedInstitution} ·{" "}
                      {entry.representativeCapacity}
                    </span>
                  </div>

                  <small>
                    {response.positions.length} POSITION
                    {response.positions.length === 1 ? "" : "S"} · RECEIVED
                  </small>
                </div>
              </summary>

              <div className={styles.responseRecordBody}>
                <header className={styles.responseReceiptHeader}>
                  <div>
                    <span>Attributable response record</span>
                    <strong>{response.actor}</strong>
                    <small>
                      Receipt {response.id} · {response.representativeCapacity}
                    </small>
                  </div>

                  <time dateTime={response.recordedAt}>
                    {new Date(response.recordedAt).toLocaleString()}
                  </time>
                </header>

                <ol className={styles.responsePositions}>
                  {response.positions.map((position, index) => (
                    <li key={`${response.id}:${position.reference || index}`}>
                      <div>
                        <span>{position.reference}</span>
                        <strong>{position.responseType}</strong>
                      </div>

                      {position.note ? <p>{position.note}</p> : null}
                    </li>
                  ))}
                </ol>

                <p className={styles.responseBoundary}>
                  Participant record preserved as submitted. Operator
                  interpretation, alignment classification, and any formation
                  finding remain separate institutional acts.
                </p>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
