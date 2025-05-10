'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import PDFToolbar from './PDFToolbar';
import styles from './WhitepaperViewer.module.css';
import { motion, AnimatePresence } from 'framer-motion';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

interface WhitepaperViewerProps {
  allowedDocs: string[];
  partnerName?: string;
  displayName?: string;
  greeting?: string;
}

const WhitepaperViewer: React.FC<WhitepaperViewerProps> = ({ allowedDocs, partnerName, displayName, greeting }) => {
  const [currentDoc, setCurrentDoc] = useState<string>(allowedDocs[0]);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [useWidth, setUseWidth] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
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
      {displayName && (
        <div className={styles.partnerGreeting}>
          <h2>👋 Welcome, {displayName}!</h2>
          {greeting && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>{greeting}</motion.p>}
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>📄 Use the document dropdown below to view your access.</p>
        </div>
      )}

      <div className={styles.sidebar}>
        {Array.from(new Array(numPages), (_, index) => (
          <div
            key={`thumb_${index + 1}`}
            className={`${styles.thumbnail} ${pageNumber === index + 1 ? styles.activeThumbnail : ''}`}
            onClick={() => setPageNumber(index + 1)}
          >
            <Document file={`/docs/${currentDoc}`}>
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

      <div className={styles.pdfViewerArea} ref={containerRef}>
        <div className={styles.pdfToolbarWrapper}>
          <PDFToolbar
            pageNumber={pageNumber}
            numPages={numPages}
            setPageNumber={setPageNumber}
            currentDoc={currentDoc}
            allowedDocs={allowedDocs}
            setCurrentDoc={setCurrentDoc}
          />
        </div>
        <div className={styles.pdfContainer}>
          <Document
            file={`/docs/${currentDoc}`}
            onLoadSuccess={onDocumentLoadSuccess}
            className={styles.pdfDocument}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={pageNumber + currentDoc}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={!useWidth ? calculatedScale : undefined}
                  width={useWidth ? containerWidth : undefined}
                  renderTextLayer={true}
                  renderAnnotationLayer={false}
                />
              </motion.div>
            </AnimatePresence>
          </Document>
        </div>
      </div>
    </div>
  );
};

export default WhitepaperViewer;
