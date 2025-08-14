'use client';

import styles from './CatalogueViewer.module.css';

export default function CatalogueViewer() {
  return (
    <section className={styles.catalogueSection}>
      <h2 className={styles.catalogueTitle}>Shadow Vault Catalogue</h2>
      <div className={styles.catalogueFrame}>
        <iframe
          src="/docs/shadow-vault/shadow-vault-catalogue.pdf"
          title="Shadow Vault Catalogue"
          className={styles.catalogueIframe}
        />
      </div>
    </section>
  );
}