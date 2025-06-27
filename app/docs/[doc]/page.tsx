// app/docs/[doc]/page.tsx
'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import styles from './DocViewer.module.css';
import PDFErrorFallback from '@/components/PDFErrorFallback';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function DocViewerPage() {
  const { doc } = useParams();
  const searchParams = useSearchParams();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState(true);

  const token = searchParams.get('token');
  const folder = searchParams.get('folder') || 'AXPT';

  useEffect(() => {
    if (!doc || typeof doc !== 'string') return;
    fetch(`/api/docs/${doc}?token=${token}&folder=${folder}`)
      .then((res) => {
        if (!res.ok) {
          setTokenValid(false);
          return res.text().then(setError);
        }
      })
      .catch(() => {
        setTokenValid(false);
        setError('Network error occurred while verifying access.');
      });
  }, [doc, token, folder]);

  if (!doc || typeof doc !== 'string') {
    return <div className={styles.error}>Invalid document parameter.</div>;
  }

  if (!tokenValid && error) {
    return <PDFErrorFallback message={error} />;
  }

  return (
    <div className={styles.fullscreenContainer}>
      <div className={styles.viewerInner}>
        <h1 className={styles.title}>📄 {decodeURIComponent(doc)}</h1>

        <div className={styles.scrollWrapper}>
          <Document
            file={`/docs/${folder}/${doc}`}
            onLoadSuccess={({ numPages }: { numPages: number }) => setNumPages(numPages)}
            onLoadError={(err: Error) => setError(String(err))}
            className={styles.document}
          >
            {Array.from(new Array(numPages), (_, index) => (
              <Page key={index + 1} pageNumber={index + 1} className={styles.page} />
            ))}
          </Document>
        </div>

        {error && <div className={styles.error}>{error}</div>}
      </div>
    </div>
  );
}