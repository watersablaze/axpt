'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import PDFToolbar from '@/components/PDFToolbar';
import PDFToolbarMobile from '@/components/PDFToolbarMobile';
import styles from '@/components/WhitepaperViewer.module.css';
import { FloatingHint } from '@/components/FloatingHint';
import { motion, AnimatePresence } from 'framer-motion';
import { isIOS } from '@/lib/utils/device';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

interface WhitepaperViewerProps {
  docs?: string[];
  partnerName?: string;
  displayName?: string;
  greeting?: string;
}

const WhitepaperViewer: React.FC<WhitepaperViewerProps> = ({
  docs = [],
  partnerName,
  displayName,
  greeting,
}) => {
  const [showGreeting, setShowGreeting] = useState(true);
  const [currentDoc, setCurrentDoc] = useState<string>(docs[0] || '');
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [useWidth, setUseWidth] = useState<boolean>(true);
  const [docSwitchCount, setDocSwitchCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    const timer = setTimeout(() => setShowGreeting(false), 15000);
    return () => clearTimeout(timer);
  }, []);

  const handleDocChange = (doc: string) => {
    setCurrentDoc(doc);
    setDocSwitchCount((prev) => prev + 1);
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

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const enterFullscreen = async () => {
    const elem = containerRef.current;
    if (elem && elem.requestFullscreen) {
      await elem.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const idealPdfWidth = 800;
  const idealPdfHeight = 1100;
  const scaleWidth = containerWidth / idealPdfWidth;
  const scaleHeight = containerHeight / idealPdfHeight;
  const calculatedScale = Math.min(scaleWidth, scaleHeight);

  if (!docs.length) {
    return (
      <div className={styles.viewerContainer}>
        <div className={styles.pdfViewerArea}>
          <p style={{ padding: '2rem', color: '#f88' }}>
            ⚠️ No documents available for your tier or token is missing access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.viewerContainer}>
      {!isMobile && (
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
      )}

      <div
        className={isMobile ? styles.pdfViewerAreaMobile : styles.pdfViewerArea}
        ref={containerRef}
      >
        <AnimatePresence>
          {!isMobile && displayName && showGreeting && (
            <motion.div
              className={styles.partnerGreetingPopup}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: '150%' }}
              transition={{ duration: 0.6, delay: 2 }}
            >
              <div className={styles.greetingBoxContent}>
                <h2>👋 Welcome, {displayName}!</h2>
                {greeting && <p>{greeting}</p>}
                <button
                  className={styles.closeButton}
                  onClick={() => setShowGreeting(false)}
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isMobile ? (
          <div className={styles.pdfToolbarWrapper}>
            <PDFToolbar
              pageNumber={pageNumber}
              numPages={numPages}
              setPageNumber={setPageNumber}
              currentDoc={currentDoc}
              allowedDocs={docs}
              setCurrentDoc={handleDocChange}
              onToggleFullscreen={isFullscreen ? exitFullscreen : enterFullscreen}
              isFullscreen={isFullscreen}
            />
          </div>
        ) : (
          <div className={styles.overlayToolbarMobile}>
            <PDFToolbarMobile
              pageNumber={pageNumber}
              numPages={numPages}
              setPageNumber={setPageNumber}
              currentDoc={currentDoc}
              allowedDocs={docs}
              setCurrentDoc={handleDocChange}
            />
          </div>
        )}

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
