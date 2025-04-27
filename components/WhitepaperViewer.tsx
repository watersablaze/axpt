import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import PDFToolbar from './PDFToolbar';
import styles from './WhitepaperViewer.module.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

interface WhitepaperViewerProps {
  pdfFile: string;
}

const WhitepaperViewer: React.FC<WhitepaperViewerProps> = ({ pdfFile }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [searchText, setSearchText] = useState<string>('');
  const [useWidth, setUseWidth] = useState<boolean>(true); // 🟢 Toggle between width and scale!
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
  };

  // 🟢 Resize Observer for container sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        setContainerWidth(offsetWidth);
        setContainerHeight(offsetHeight);
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 🟠 Scaling logic (if using scale instead of width)
  const idealPdfWidth = 800;
  const idealPdfHeight = 1100;
  const scaleWidth = containerWidth / idealPdfWidth;
  const scaleHeight = containerHeight / idealPdfHeight;
  const calculatedScale = Math.min(scaleWidth, scaleHeight);

  // 🔍 Search Highlight Logic
  useEffect(() => {
    const textLayers = document.querySelectorAll('.react-pdf__Page__textContent');
    textLayers.forEach((layer) => {
      const spans = layer.querySelectorAll('span');
      spans.forEach((span) => {
        const text = span.textContent || '';
        if (searchText) {
          span.innerHTML = text.replace(
            new RegExp(`(${searchText})`, 'gi'),
            '<mark>$1</mark>'
          );
        } else {
          span.innerHTML = text;
        }
      });
    });
  }, [searchText, pageNumber]);

  return (
    <div className={styles.viewerContainer}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        {Array.from(new Array(numPages), (_, index) => (
          <div
            key={`thumb_${index + 1}`}
            className={`${styles.thumbnail} ${pageNumber === index + 1 ? styles.activeThumbnail : ''}`}
            onClick={() => setPageNumber(index + 1)}
          >
            <Document file={pdfFile}>
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
            scale={scale}
            setScale={setScale}
            searchText={searchText}
            onSearchChange={handleSearchChange}
          />
        </div>
        <div className={styles.pdfContainer}>
          <Document
            file={pdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
            className={styles.pdfDocument}
          >
            <Page
              pageNumber={pageNumber}
              scale={!useWidth ? calculatedScale : undefined}
              width={useWidth ? containerWidth : undefined}
              renderTextLayer
            />
          </Document>
        </div>
      </div>
    </div>
  );
};

export default WhitepaperViewer;