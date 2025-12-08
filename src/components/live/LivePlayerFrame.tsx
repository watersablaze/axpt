'use client';

import Image from 'next/image';
import VideoStream from '@/components/nommo/player/VideoStream';
import type { LiveEvent } from '@/lib/live/events';
import styles from './LivePlayerFrame.module.css';

export default function LivePlayerFrame({
  online,
  event,
}: {
  online: boolean;
  event: LiveEvent | null;
}) {
  const offlineImage = event?.offlineImage ?? '/live/offline.png';
  const offlineAlt = event?.title
    ? `${event.title} offline presentation`
    : 'AXPT Live offline presentation';

  return (
    <div className={styles.frame}>

      {!online ? (
        <div className={styles.offlineWrapper}>
          <Image
            src={offlineImage}
            alt={offlineAlt}
            fill
            priority
            className={styles.offlineImage}
          />
        </div>
      ) : (
        <VideoStream />
      )}

    </div>
  );
}
