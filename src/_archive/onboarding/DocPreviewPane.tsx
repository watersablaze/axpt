// 📁 components/onboarding/DocPreviewPane.tsx
'use client';

import styles from './DocPreviewPane.module.css';

interface DocPreviewPaneProps {
  selectedDoc: string | null;
  folder?: string;
  token?: string;
}

export function DocPreviewPane({
  selectedDoc,
  folder = 'AXPT',
  token = '',
}: DocPreviewPaneProps) {
  if (!selectedDoc) {
    return <div className={styles.empty}>Select a document to preview.</div>;
  }

  const url = `/docs/${folder}/${selectedDoc}#toolbar=0&navpanes=0&scrollbar=0&token=${token}`;

  return (
    <div className={styles.previewPane}>
      <iframe
        src={url}
        title="Document Preview"
        width="100%"
        height="600px"
        className={styles.iframe}
      ></iframe>
    </div>
  );
}