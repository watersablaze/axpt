'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import PDFToolbar from './PDFToolbar';
import styles from './WhitepaperViewer.module.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

interface WhitepaperViewerProps {
  allowedDocs: string[]; // Now expects list of PDFs
}

const WhitepaperViewer: React.FC<WhitepaperViewerProps> = ({ allowedDocs }) => {
  const [selectedDoc, setSelectedDoc] = useState<string>(allowedDocs[0]);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [useWidth, setUseWidth] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1); // Reset page on doc change
  };

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        setContainerWidth(offsetWidth);
        setContainerHeight(offsetHeight);
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(() => updateSize());

    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const idealPdfWidth = 800;
  const idealPdfHeight = 1100;
  const scaleWidth = containerWidth / idealPdfWidth;
  const scaleHeight = containerHeight / idealPdfHeight;
  const calculatedScale = Math.min(scaleWidth, scaleHeight);

  return (
    <div className={styles.viewerContainer}>
      {/* PDF Selector Dropdown */}
      <div className={styles.dropdownWrapper}>
        <label htmlFor="docSelector">📄 Select Document: </label>
        <select
          id="docSelector"
          value={selectedDoc}
          onChange={(e) => setSelectedDoc(e.target.value)}
        >
          {allowedDocs.map((doc) => (
            <option key={doc} value={doc}>
              {doc.replace(/_/g, ' ').replace(/\.pdf$/, '')}
            </option>
          ))}
        </select>
      </div>

      {/* Sidebar */}
      <div className={styles.sidebar}>
        {Array.from(new Array(numPages), (_, index) => (
          <div
            key={`thumb_${index + 1}`}
            className={`${styles.thumbnail} ${pageNumber === index + 1 ? styles.activeThumbnail : ''}`}
            onClick={() => setPageNumber(index + 1)}
          >
            <Document file={`/docs/${selectedDoc}`}>
              <Page
                pageNumber={index + 1}
                scale={0.2}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
            <div className={styles.pageNumberLabel}>Page {index + 1}</div>
          </div>
        ))}
        <div className={styles.toggleWrapper}>
          <label>
            <input
              type="checkbox"
              checked={useWidth}
              onChange={() => setUseWidth(!useWidth)}
            />{' '}
            Use Width Fit
          </label>
        </div>
      </div>

      {/* Main Viewer */}
      <div className={styles.pdfViewerArea} ref={containerRef}>
        <div className={styles.pdfToolbarWrapper}>
          <PDFToolbar
            pageNumber={pageNumber}
            numPages={numPages}
            setPageNumber={setPageNumber}
          />
        </div>
        <div className={styles.pdfContainer}>
          <Document
            file={`/docs/${selectedDoc}`}
            onLoadSuccess={onDocumentLoadSuccess}
            className={styles.pdfDocument}
          >
            <Page
              pageNumber={pageNumber}
              scale={!useWidth ? calculatedScale : undefined}
              width={useWidth ? containerWidth : undefined}
              renderTextLayer={true}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>
      </div>
    </div>
  );
};

export default WhitepaperViewer;