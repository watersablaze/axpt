'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './SurfaceHeader.module.css';

type Props = {
  kicker: string;
  title?: string;
  subline?: string;
  active?: boolean;
  align?: 'left' | 'center' | 'axis'
  size?: 'sm' | 'md';
  showRule?: boolean;
  className?: string;
};

export default function SurfaceHeader({
  kicker,
  title,
  subline,
  active = false,
  align = 'left',
  size = 'md',
  showRule = true,
  className = '',
}: Props) {

  const headerRef = useRef<HTMLElement | null>(null);
  const [isLive, setIsLive] = useState(active);

  useEffect(() => {

    const el = headerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {

        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsLive(true);
          }, 140);
        }

      },
      {
        threshold: 0.4,
        rootMargin: '0px 0px -10% 0px'
      }
    );

    observer.observe(el);

    return () => observer.disconnect();

  }, []);

  return (
    <header
      ref={headerRef}
      className={[
        styles.header,
        isLive ? styles.active : '',
        styles[`align_${align}`],
        styles[`size_${size}`],
        className,
      ].join(' ')}
    >
      <div className={styles.kickerRow}>
        <span className={styles.node} aria-hidden="true" />
        <span className={styles.kicker}>{kicker}</span>
        {showRule ? <span className={styles.rule} aria-hidden="true" /> : null}
      </div>

      {title ? <h2 className={styles.title}>{title}</h2> : null}
      {subline ? <p className={styles.subline}>{subline}</p> : null}
    </header>
  );
}