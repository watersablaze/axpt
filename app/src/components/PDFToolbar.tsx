'use client';

import React, { useEffect, useState } from 'react';
import styles from './PDFToolbar.module.css';

interface PDFToolbarProps {
  pageNumber: number;
  numPages: number;
  setPageNumber: (page: number) => void;
  currentDoc?: string;
  allowedDocs?: string[];
  setCurrentDoc?: (doc: string) => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

const PDFToolbar: React.FC<PDFToolbarProps> = ({
  pageNumber,
  numPages,
  setPageNumber,
  currentDoc,
  allowedDocs = [],
  setCurrentDoc,
  onToggleFullscreen,
  isFullscreen,
}) => {
  const hasMultipleDocs = allowedDocs.length > 1 && setCurrentDoc !== undefined;
  const [showHint, setShowHint] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setShowHint(true);
      const hideTimer = setTimeout(() => setShowHint(false), 20000);
      return () => clearTimeout(hideTimer);
    }, 2500);

    return () => clearTimeout(delayTimer);
  }, []);

  return (
    <div className={styles.toolbar}>
      <div className={styles.leftGroup}>
        <button
          className={styles.toolbarButton}
          onClick={() => setPageNumber(Math.max(pageNumber - 1, 1))}
          disabled={pageNumber <= 1}
        >
          ◀ Previous
        </button>

        <span className={styles.pageIndicator}>
          Page {pageNumber} of {numPages}
        </span>

        <button
          className={styles.toolbarButton}
          onClick={() => setPageNumber(Math.min(pageNumber + 1, numPages))}
          disabled={pageNumber >= numPages}
        >
          Next ▶
        </button>
      </div>

      <div className={styles.rightGroup}>
        {hasMultipleDocs && (
          <>
            <label htmlFor="docSelector">📄 Document:</label>
            <select
              id="docSelector"
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
            {/* Hint removed for cleaner interface */}
          </>
        )}

        {/* Hide fullscreen button on mobile */}
        {!isMobile && onToggleFullscreen && (
          <button
            className={styles.toolbarButton}
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PDFToolbar;
