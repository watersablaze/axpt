'use client';

import React, { useEffect, useState } from 'react';
import styles from './PDFToolbarMobile.module.css';

interface PDFToolbarMobileProps {
  pageNumber: number;
  numPages: number;
  setPageNumber: (page: number) => void;
  currentDoc?: string;
  allowedDocs?: string[];
  setCurrentDoc?: (doc: string) => void;
}

const PDFToolbarMobile: React.FC<PDFToolbarMobileProps> = ({
  pageNumber,
  numPages,
  setPageNumber,
  currentDoc,
  allowedDocs = [],
  setCurrentDoc,
}) => {
  const hasMultipleDocs = allowedDocs.length > 1 && setCurrentDoc !== undefined;
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setShowHint(true);
      const hideTimer = setTimeout(() => setShowHint(false), 12000);
      return () => clearTimeout(hideTimer);
    }, 2500);

    return () => clearTimeout(delayTimer);
  }, []);

  return (
    <div className={styles.mobileToolbarContainer}>
      <div className={styles.navGroup}>
        <button
          className={styles.toolbarButton}
          onClick={() => setPageNumber(Math.max(pageNumber - 1, 1))}
          disabled={pageNumber <= 1}
        >
          ◀
        </button>

        <span className={styles.pageIndicator}>
          {pageNumber} / {numPages}
        </span>

        <button
          className={styles.toolbarButton}
          onClick={() => setPageNumber(Math.min(pageNumber + 1, numPages))}
          disabled={pageNumber >= numPages}
        >
          ▶
        </button>
      </div>

      {hasMultipleDocs && (
        <div className={styles.docSelectWrapper}>
          <select
            value={currentDoc}
            onChange={(e) => setCurrentDoc?.(e.target.value)}
            className={styles.docSelect}
          >
            {allowedDocs.map((doc) => (
              <option key={doc} value={doc}>
                {doc.replace(/_/g, ' ').replace(/\.pdf$/, '')}
              </option>
            ))}
          </select>
          {showHint && (
            <div className={styles.docHint}>📄 Choose a document</div>
          )}
        </div>
      )}
    </div>
  );
};

export default PDFToolbarMobile;
