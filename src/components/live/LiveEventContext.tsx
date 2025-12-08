'use client';

import type { LiveEvent } from '@/lib/live/events';
import styles from './LiveEventContext.module.css';

export default function LiveEventContext({
  online,
  event,
}: {
  online: boolean;
  event: LiveEvent | null;
}) {
  if (!event) return null;

  return (
    <section className={styles.context}>
      <h2 className={styles.title}>{event.title}</h2>

      {event?.tagline && <p className={styles.tagline}>{event.tagline}</p>}

      <div className={styles.meta}>
        {event.hosts && (
          <p><strong>Hosts:</strong> {event.hosts.join(', ')}</p>
        )}
        {event.locations && (
          <p><strong>Locations:</strong> {event.locations.join(' ↔ ')}</p>
        )}
      </div>

      {event.description && (
        <p className={styles.description}>{event.description}</p>
      )}
    </section>
  );
}