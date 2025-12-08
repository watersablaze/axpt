'use client';

import LiveInvocation from './LiveInvocation';
import LivePlayerFrame from './LivePlayerFrame';
import LiveEventContext from './LiveEventContext';
import type { OwncastHealth } from '@/lib/live/owncastTypes';
import type { LiveEvent } from '@/lib/live/events';
import styles from './LivePortalShell.module.css';

export default function LivePortalShell({
  health,
  event,
}: {
  health: OwncastHealth | null;
  event: LiveEvent | null;
}) {
  const online = health?.online ?? false;

  return (
    <div className={styles.shell}>
      {/* ---------- AXPT LIVE HEADER ---------- */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {/* tiny sigil placement */}
          <img src="/sigil/mini-sigil.png" className={styles.sigilMini} />
          <span className={styles.portalTitle}>AXPT LIVE · Transmission Portal</span>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.status} data-status={online ? 'live' : 'offline'}>
            {online ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </header>

      {/* ---------- CEREMONIAL INVOCATION ---------- */}
      <LiveInvocation online={online} event={event} />

      {/* ---------- STREAM WINDOW OR OFFLINE CARD ---------- */}
      <LivePlayerFrame online={online} event={event} />

      {/* ---------- CONTEXT BLOCK (EVENT INFO) ---------- */}
      <LiveEventContext online={online} event={event} />

      {/* ---------- OPTIONAL NOMMO PATHWAYS ---------- */}
      {/* Add links to archive, Nommo Media index, etc.*/}
    </div>
  );
}