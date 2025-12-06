// src/components/live/analytics/ViewersGraph.tsx
'use client';

import { useMemo } from 'react';
import type { ViewersGraphProps, ViewerAnalyticsPoint } from '@/lib/live/owncastTypes';
import styles from './ViewersGraph.module.css'; // optional – or remove if not using

function normalizeData(data: ViewerAnalyticsPoint[]) {
  if (!data.length) return { min: 0, max: 1 };

  let min = data[0].viewers;
  let max = data[0].viewers;

  for (const point of data) {
    if (point.viewers < min) min = point.viewers;
    if (point.viewers > max) max = point.viewers;
  }

  if (min === max) {
    // Avoid a flat-line / divide-by-zero scenario
    min = 0;
    max = max || 1;
  }

  return { min, max };
}

export default function ViewersGraph({
  data,
  isLoading = false,
  error = null,
  className,
}: ViewersGraphProps) {
  const { min, max } = useMemo(() => normalizeData(data), [data]);

  const pathD = useMemo(() => {
    if (!data.length) return '';

    const width = 100;
    const height = 40;
    const span = max - min;

    return data
      .map((point, index) => {
        const x = (index / Math.max(1, data.length - 1)) * width;
        const value = point.viewers;
        const normalized = (value - min) / span;
        const y = height - normalized * height;
        const command = index === 0 ? 'M' : 'L';
        return `${command}${x},${y}`;
      })
      .join(' ');
  }, [data, min, max]);

  // 🌫️ Loading state
  if (isLoading) {
    return (
      <div className={`${styles.container ?? ''} ${className ?? ''}`}>
        <div className={styles.skeleton ?? ''}>
          <span className={styles.label ?? ''}>Loading viewer activity…</span>
        </div>
      </div>
    );
  }

  // ⚠️ Error state
  if (error) {
    return (
      <div className={`${styles.container ?? ''} ${className ?? ''}`}>
        <p className={styles.error ?? ''}>
          Live analytics unavailable right now.
          <span className={styles.errorDetails ?? ''}> {error}</span>
        </p>
      </div>
    );
  }

  // 🌑 Empty state
  if (!data.length) {
    return (
      <div className={`${styles.container ?? ''} ${className ?? ''}`}>
        <p className={styles.empty ?? ''}>
          No viewer data yet. Start a stream to see live activity.
        </p>
      </div>
    );
  }

  return (
    <div className={`${styles.container ?? ''} ${className ?? ''}`}>
      <div className={styles.header ?? ''}>
        <h3 className={styles.title ?? ''}>Live viewers over time</h3>
        <span className={styles.range ?? ''}>
          {data.length} points · {min}–{max} viewers
        </span>
      </div>

      <div className={styles.graphWrap ?? ''}>
        <svg
          viewBox="0 0 100 40"
          role="img"
          aria-label="Live viewers over time"
          className={styles.graph ?? ''}
          preserveAspectRatio="none"
        >
          {/* Ghost area */}
          {pathD && (
            <path
              d={`${pathD} L100,40 L0,40 Z`}
              className={styles.area ?? ''}
            />
          )}

          {/* Line */}
          {pathD && (
            <path
              d={pathD}
              className={styles.line ?? ''}
            />
          )}
        </svg>
      </div>
    </div>
  );
}