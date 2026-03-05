'use client';

import styles from './LayerIndicator.module.css';
import { useLayer } from '@/lib/context/LayerContext';

const LABELS: Record<string, { title: string; sub: string }> = {
  ENTRY: { title: 'ENTRY', sub: 'Instrument online' },
  FOUNDATION: { title: 'FOUNDATION', sub: 'Continuity baseline' },
  FRAMEWORK: { title: 'FRAMEWORK', sub: 'Authority map' },
  INTERFACES: { title: 'INTERFACES', sub: 'Human-system boundary' },
  ETHOS: { title: 'ETHOS', sub: 'Custodial circulation' },
  PRESENCE: { title: 'PRESENCE', sub: 'Signal + witness' },
};

export default function LayerIndicator({ compact = false }: { compact?: boolean }) {
  const { activeLayer } = useLayer();
  const meta = LABELS[activeLayer] ?? { title: activeLayer, sub: '—' };

  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ''}`} aria-label="AXPT Layer Indicator">
      <div className={styles.dot} aria-hidden="true" />
      <div className={styles.text}>
        <div className={styles.kicker}>SYS // LAYER</div>
        <div className={styles.value}>{meta.title}</div>
        {!compact && <div className={styles.sub}>{meta.sub}</div>}
      </div>
    </div>
  );
}