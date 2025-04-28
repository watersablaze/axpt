import React from 'react';
import styles from './PDFToolbar.module.css';

interface PDFToolbarProps {
  pageNumber: number;
  numPages: number;
  setPageNumber: (page: number) => void;
}

const PDFToolbar: React.FC<PDFToolbarProps> = ({
  pageNumber,
  numPages,
  setPageNumber,
}) => {
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
    </div>
  );
};

export default PDFToolbar;