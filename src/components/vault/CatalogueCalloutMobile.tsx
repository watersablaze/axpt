'use client';

import { useMemo, useState, useCallback } from 'react';
import styles from './CatalogueCalloutMobile.module.css';
import CatalogueViewerMobile from './CatalogueViewerMobile';

type Props = {
  src?: string;
  title?: string;
  downloadFileName?: string;
  coverSrc?: string; // path under /public
};

export default function CatalogueCalloutMobile({
  src = '/api/pdf/shadow-vault/shadow-vault-catalogue.pdf',
  title = 'Shadow Vault Catalogue',
  downloadFileName = 'shadow-vault-catalogue.pdf',
  coverSrc = '/images/shadow-vault/catalogue-cover.jpg', // <-- put your cover here
}: Props) {
  const [open, setOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const isIOS = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /\b(iPad|iPhone|iPod)\b/i.test(navigator.userAgent);
  }, []);

  const primePreview = useCallback(() => {
    if (!open) setOpen(true);
    if (!showPreview) setShowPreview(true);
  }, [open, showPreview]);

  const openPdf = useCallback(() => {
    // Open the PDF in a new tab; page stays put
    window.open(src, '_blank', 'noopener');
  }, [src]);

  return (
    <section className={styles.card} aria-labelledby="sv-cat-title">
      <div className={styles.header}>
        <h2 id="sv-cat-title" className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>Quick reference before you submit.</p>
      </div>

      <div className={styles.actionsRow}>
        <a
          className={styles.btnPrimary}
          href={src}
          download={downloadFileName}
          onClick={primePreview}
          onTouchStart={primePreview}
        >
          Download
        </a>
        <a
          className={styles.btnSecondary}
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          onClick={primePreview}
          onTouchStart={primePreview}
        >
          Open
        </a>
      </div>

        <button
        type="button"
        className={`${styles.btnSecondary} ${styles.btnFull}`} // <- matches Download/Open
        onClick={() => setShowPreview(v => !v)}
        aria-pressed={showPreview}
        aria-controls="sv-inline-preview"
        >
        {showPreview ? 'Hide preview' : 'Preview inline'}
        </button>

      {showPreview && (
        <div id="sv-inline-preview" className={styles.previewWrap}>
          {isIOS ? (
            coverSrc ? (
              // Tap cover to open the PDF in a new tab
              <div
                className={styles.coverTap}
                role="button"
                tabIndex={0}
                aria-label={`${title} – tap to open`}
                onClick={openPdf}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openPdf()}
              >
                <img
                  src={coverSrc}
                  alt={`${title} cover`}
                  className={styles.coverImg}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ) : (
              <div className={styles.fallback}>
                Inline preview is limited on this device. Use Open or Download above.
              </div>
            )
          ) : (
            <CatalogueViewerMobile
              src={src}
              title={title}
              downloadFileName={downloadFileName}
              compact
            />
          )}
        </div>
      )}
    </section>
  );
}