// 📁 src/components/vault/SecureScroll.tsx

'use client';

import { useEffect, useState } from 'react';
import styles from './SecureScroll.module.css';
import { getPdfPath, ALLOWED_DOCS } from '@/lib/token/getPdfPath';
import { docLabelMap } from '@/lib/token/docMeta';

interface SecureScrollProps {
  params?: { doc?: string };
  searchParams: { token?: string };
}

const isMobile =
  typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);

export default function SecureScroll({ params, searchParams }: SecureScrollProps) {
  const [loaded, setLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const rawSlug = params?.doc;
  const docSlug = rawSlug?.toLowerCase().trim();

  if (!docSlug) {
    console.error('[SecureScroll] ❌ Missing or invalid params.doc');
    return (
      <div className={styles.viewerPage}>
        <header className={styles.header}>
          <h1 className={styles.title}>📄 Invalid Document</h1>
          <p className={styles.subtitle}>No document specified or URL is malformed.</p>
        </header>
      </div>
    );
  }

  const isAllowedDoc = (ALLOWED_DOCS as readonly string[]).includes(docSlug);
  const fileUrl = isAllowedDoc
    ? `${getPdfPath(docSlug as typeof ALLOWED_DOCS[number])}#zoom=page-width`
    : `/docs/AXPT/${docSlug}.pdf#zoom=page-width`;

  const displayTitle = docLabelMap[docSlug] ?? `${docSlug}.pdf`;

  useEffect(() => {
    console.log('[SecureScroll] 📄 Resolved fileUrl:', fileUrl);
    console.log('[SecureScroll] 🔐 Token (truncated):', searchParams?.token?.slice(0, 20));
  }, [fileUrl, searchParams]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  useEffect(() => {
    const exitHandler = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener('fullscreenchange', exitHandler);
    return () => document.removeEventListener('fullscreenchange', exitHandler);
  }, []);

  if (isMobile) {
    return (
      <div className={styles.viewerPage}>
        <header className={styles.header}>
          <h1 className={styles.title}>🔐 Doc Vault</h1>
          <span className={styles.subtitle}>
            Viewing: <code>{displayTitle}</code>
          </span>
        </header>
        <div className={styles.mobileNotice}>
          ⚠️ PDF viewing on mobile may be limited.{' '}
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            Tap here to open in a new tab
          </a>{' '}
          for best experience.
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.viewerPage} ${isFullscreen ? styles.fullscreen : ''}`}>
      <header className={`${styles.header} ${loaded ? styles.reveal : styles.blur}`}>
        <h1 className={`${styles.title} ${styles.slideFade}`}>🔐 Doc Vault</h1>
        <span className={styles.subtitle}>
          Viewing: <code>{displayTitle}</code>
        </span>
        <button className={styles.fullscreenToggle} onClick={toggleFullscreen}>
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </header>

      {!loaded && (
        <div className={styles.loaderOverlay}>
          <div className={styles.loaderText}>
            📜 Generating Document<span className={styles.cursor}>▋</span>
          </div>
        </div>
      )}

      <iframe
        src={fileUrl}
        title="Sacred Scroll"
        className={`${styles.iframe} ${loaded ? styles.reveal : styles.blur}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}