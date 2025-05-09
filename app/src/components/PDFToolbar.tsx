'use client';

import React from 'react';
import styles from './PDFToolbar.module.css';

interface PDFToolbarProps {
  pageNumber: number;
  numPages: number;
  setPageNumber: (page: number) => void;
  currentDoc?: string;
  allowedDocs?: string[];
  setCurrentDoc?: (doc: string) => void;
}

const PDFToolbar: React.FC<PDFToolbarProps> = ({
  pageNumber,
  numPages,
  setPageNumber,
  currentDoc,
  allowedDocs = [],
  setCurrentDoc,
}) => {
  const hasMultipleDocs = allowedDocs.length > 1 && setCurrentDoc;

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

      {hasMultipleDocs && (
        <div className={styles.rightGroup}>
          <label htmlFor="docSelector">📄 Document:</label>
          <select
            id="docSelector"
            value={currentDoc}
            onChange={(e) => setCurrentDoc(e.target.value)}
            className={styles.docSelect}
          >
            {allowedDocs.map((doc) => (
              <option key={doc} value={doc}>
                {doc.replace(/_/g, ' ').replace(/\.pdf$/, '')}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default PDFToolbar;