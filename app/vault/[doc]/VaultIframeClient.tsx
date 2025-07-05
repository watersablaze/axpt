'use client';

import { useEffect, useState } from 'react';
import styles from './Vault.module.css';

type Props = {
  doc: string;
};

const fileMap: Record<string, string> = {
  'AXPT-Whitepaper': 'whitepaper.pdf',
  'Hemp_Ecosystem': 'hemp.pdf',
  'CIM_Chinje': 'chinje.pdf',
};

export default function VaultIframeClient({ doc }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fileName = fileMap[doc] || `${doc}.pdf`;
  const fileUrl = `/docs/AXPT/${fileName}#zoom=page-width`;

  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  useEffect(() => {
    if (isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, [isFullscreen]);

  return (
    <div
      className={`${styles.viewerPage} ${
        isFullscreen ? styles.fullscreen : ''
      }`}
    >
      <header className={`${styles.header} ${loaded ? styles.reveal : styles.blur}`}>
        <h1 className={`${styles.title} ${styles.slideFade}`}>🔐 Doc Vault</h1>
        <span className={`${styles.subtitle}`}>Viewing: <code>{fileName}</code></span>
        <button className={styles.fullscreenToggle} onClick={toggleFullscreen}>
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </header>

      {!loaded && (
        <div className={styles.loaderOverlay}>
          <div className={styles.loaderText}>📜 Generating Document<span className={styles.cursor}>▋</span></div>
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