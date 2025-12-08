'use client';

import type { LiveEvent } from '@/lib/live/events';
import styles from './LiveInvocation.module.css';

export default function LiveInvocation({
  online,
  event,
}: {
  online: boolean;
  event: LiveEvent | null;
}) {
  return (
    <section className={styles.invocation}>
      {!online && (
        <>
          <p className={styles.line1}>You are entering an AXPT Transmission.</p>
          {event?.series && (
            <p className={styles.series}>{event.series}</p>
          )}
          <p className={styles.line2}>
            A ceremonial passage of story, struggle, lineage, and signal.
          </p>
        </>
      )}

      {online && (
        <p className={styles.liveNow}>Transmission in progress.</p>
      )}
    </section>
  );
}