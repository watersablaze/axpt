'use client';

import React from 'react';
import styles from './PDFToolbar.module.css';

export interface PDFToolbarProps {
  pageNumber: number;
  numPages: number;
  setPageNumber: (page: number) => void;
  currentDoc: string;
  allowedDocs: string[];
  setCurrentDoc: (doc: string) => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

const PDFToolbar: React.FC<PDFToolbarProps> = ({
  pageNumber,
  numPages,
  setPageNumber,
  currentDoc,
  allowedDocs,
  setCurrentDoc,
  onToggleFullscreen,
  isFullscreen,
}) => {
  return (
    <div className={styles.toolbar}>
      <div className={styles.controls}>
        <button onClick={() => setPageNumber(Math.max(1, pageNumber - 1))} disabled={pageNumber <= 1}>
          ← Prev
        </button>
        <span>
          Page {pageNumber} of {numPages}
        </span>
        <button onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))} disabled={pageNumber >= numPages}>
          Next →
        </button>
      </div>

      <div className={styles.controls}>
        <label>
          Document:
          <select value={currentDoc} onChange={(e) => setCurrentDoc(e.target.value)}>
            {allowedDocs.map((doc) => (
              <option key={doc} value={doc}>
                {doc}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button onClick={onToggleFullscreen}>
        {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      </button>
    </div>
  );
};

export default PDFToolbar;