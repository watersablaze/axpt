import React from 'react';
import styles from './PDFToolbar.module.css';

interface PDFToolbarProps {
  pageNumber: number;
  numPages: number;
  setPageNumber: (page: number) => void;
  scale: number;
  setScale: (scale: number) => void;
  searchText: string;
  onSearchChange: (text: string) => void;
}

const PDFToolbar: React.FC<PDFToolbarProps> = ({
  pageNumber,
  numPages,
  setPageNumber,
  scale,
  setScale,
  searchText,
  onSearchChange,
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

      <div className={styles.centerGroup}>
        <input
          className={styles.searchInput}
          type="text"
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search text..."
        />
      </div>

      <div className={styles.rightGroup}>
        <button
          className={styles.toolbarButton}
          onClick={() => setScale(scale + 0.1)}
        >
          ➕ Zoom In
        </button>
        <button
          className={styles.toolbarButton}
          onClick={() => setScale(scale - 0.1)}
        >
          ➖ Zoom Out
        </button>
      </div>
    </div>
  );
};

export default PDFToolbar;