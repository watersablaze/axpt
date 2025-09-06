'use client';

import styles from './CatalogueViewer.module.css';

type Props = {
  src?: string;
  title?: string;
  downloadLabel?: string;
  downloadFileName?: string;
  // When true, show inline header actions (download / open).
  showHeaderActions?: boolean;
};

export default function CatalogueViewer({
  src = '/docs/shadow-vault/shadow-vault-catalogue.pdf',
  title = 'Shadow Vault Catalogue',
  downloadLabel = 'Download PDF',
  downloadFileName = 'shadow-vault-catalogue.pdf',
  showHeaderActions = true,
}: Props) {
  return (
    <section className={styles.catalogueSection}>
      <div className={styles.catalogueHeader}>
        <h2 className={styles.catalogueTitle}>{title}</h2>

        {/* Desktop-only inline actions */}
        {showHeaderActions && (
          <div className={styles.actionsDesktopOnly}>
            <a
              className={styles.actionBtn}
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open PDF in a new tab"
            >
              Open in new tab
            </a>
            <a
              className={styles.actionBtnPrimary}
              href={src}
              download={downloadFileName}
              aria-label={downloadLabel}
            >
              {downloadLabel}
            </a>
          </div>
        )}
      </div>

      <div className={styles.catalogueFrame}>
        <iframe
          src={src}
          title={title}
          className={styles.catalogueIframe}
        />
      </div>
    </section>
  );
}