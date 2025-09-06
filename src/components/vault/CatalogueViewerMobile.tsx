'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './CatalogueViewerMobile.module.css';

type Props = {
  src?: string;
  title?: string;
  downloadLabel?: string;
  downloadFileName?: string;
  compact?: boolean;         // ⬅ NEW: hide header/actions when true
};

type Mode = 'iframe' | 'object' | 'failed';

export default function CatalogueViewerMobile({
  src = '/api/pdf/shadow-vault/shadow-vault-catalogue.pdf',
  title = 'Shadow Vault Catalogue',
  downloadLabel = 'Download PDF',
  downloadFileName = 'shadow-vault-catalogue.pdf',
  compact = false,
}: Props) {
  const [mode, setMode] = useState<Mode>('iframe');
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isIOS = /\b(iPad|iPhone|iPod)\b/i.test(ua);
    if (isIOS) setMode('object');
  }, []);

  useEffect(() => {
    setLoaded(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (!loaded) setMode(prev => (prev === 'iframe' ? 'object' : prev === 'object' ? 'failed' : prev));
    }, 2500);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // loaded omitted on purpose: we only care about mode/src change for timeout
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, src]);

  return (
    <section className={styles.wrapper} aria-labelledby={compact ? undefined : 'catalogue-title'}>
      {!compact && (
        <h2 id="catalogue-title" className={styles.title}>{title}</h2>
      )}

      {!compact && (
        <div className={styles.actionsRow}>
          <a className={styles.btn} href={src} download={downloadFileName}>
            {downloadLabel}
          </a>
          <a className={styles.btnSecondary} href={src} target="_blank" rel="noopener noreferrer">
            Open in Tab
          </a>
        </div>
      )}

      <div className={`${styles.frame} ${compact ? styles.compactFrame : ''}`}>
        {mode !== 'failed' ? (
          mode === 'iframe' ? (
            <iframe
              key={`iframe:${src}`}
              src={src}
              title={title}
              className={styles.iframe}
              onLoad={() => setLoaded(true)}
            />
          ) : (
            <object
              key={`object:${src}`}
              data={src + '#view=FitH'}
              type="application/pdf"
              className={styles.iframe}
              onLoad={() => setLoaded(true)}
            />
          )
        ) : (
          <div className={styles.fallback}>
            <p>
              Inline preview may be limited on this device.
              Use <strong>Open</strong> or <strong>Download</strong> above.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}