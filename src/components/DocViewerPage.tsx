// ✅ FILE: app/src/components/DocViewerPage.tsx
'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './DocViewer.module.css';

export default function DocViewerPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const docParam = Array.isArray(params.doc) ? params.doc[0] : params.doc;
  const folder = searchParams.get('folder') || 'AXPT';
  const token =
    searchParams.get('token') ??
    (typeof window !== 'undefined' ? localStorage.getItem('axpt_last_token') : null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!docParam || !token) {
      setError('❌ Missing document or token.');
      setLoading(false);
      return;
    }

    if (typeof document !== 'undefined' && !document.cookie.includes('axpt_session')) {
      document.cookie = `axpt_session=${token}; path=/`;
      console.log('🍪 Session cookie set for PDF access');
    }

    const validateAccess = async () => {
      try {
        const res = await fetch(`/api/docs/${docParam}?folder=${folder}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const text = await res.text();
          setError(text || '⚠️ Access denied for this document.');
        }
      } catch (err) {
        setError('⚠️ Error validating access.');
      } finally {
        setLoading(false);
      }
    };

    validateAccess();
  }, [docParam, token, folder]);

  if (loading) return <div className={styles.loading}>🌀 Preparing document...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  const iframeSrc = `/api/docs/${docParam}?folder=${folder}`;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>📄</span>
        <h1 className={styles.title}>{decodeURIComponent(docParam!)}</h1>
      </div>

      <div className={styles.iframeWrapper}>
        <iframe
          src={iframeSrc}
          title={`AXPT Document: ${docParam}`}
          className={styles.iframe}
          allowFullScreen
        />
      </div>
    </div>
  );
}