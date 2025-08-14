'use client';

import styles from './MobileDocumentVault.module.css';

const documents = [
  { name: 'AXPT Whitepaper', filename: 'AXPT/whitepaper.pdf' },
  { name: 'CIM: Chinje Project', filename: 'AXPT/chinje.pdf' },
  { name: 'Hemp Ecosystem', filename: 'AXPT/hemp.pdf' },
];

export default function MobileDocumentVault() {
  return (
    <div className={styles.vaultContainer}>
      <h2 className={styles.vaultTitle}>📄 Vault Documents</h2>
      <ul className={styles.docList}>
        {documents.map((doc) => (
          <li key={doc.filename} className={styles.docItem}>
            <a
              href={`/docs/${doc.filename}`}
              className={styles.link}
              target="_blank"
              rel="noreferrer"
            >
              <span className={styles.docIcon}>🪐</span> {doc.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}