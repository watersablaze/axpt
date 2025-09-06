'use client';

import dynamic from 'next/dynamic';
import styles from './ShadowVaultForm.module.css';
import ShadowVaultHero from '@/components/french-ward/ShadowVaultHero';
import SigilOverlay from '@/components/visual/SigilOverlay';
import FeaturedGemIntakeForm from '@/components/forms/FeaturedGemIntakeForm';

const FeaturedGemSectionMobile = dynamic(
  () => import('@/components/french-ward/FeaturedGemSectionMobile'),
  { ssr: false }
);

const CatalogueCalloutMobile = dynamic(
  () => import('@/components/vault/CatalogueCalloutMobile'),
  { ssr: false }
);

export default function ShadowVaultMobile() {
  const pdfSrc = '/api/pdf/shadow-vault/shadow-vault-catalogue.pdf';
  const pdfDownloadName = 'shadow-vault-catalogue.pdf';

  const scrollToForm = () => {
    const el = document.getElementById('sv-form');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <ShadowVaultHero />

      {/* scroll target for hero cue */}
      <div id="after-hero" />

      <div className={`${styles.container} ${styles.afterHero}`} style={{ minHeight: '100dvh' }}>
        <div className={`${styles.inner} ${styles.stack}`}>

          {/* 🌟 Featured Trinity */}
          <section className={`${styles.section} ${styles.featuredClamp}`}>
            <FeaturedGemSectionMobile />
          </section>

          {/* 📜 Catalogue Callout */}
          <section className={styles.section}>
            <CatalogueCalloutMobile
              src={pdfSrc}
              title="Shadow Vault Catalogue"
              downloadFileName={pdfDownloadName}
              coverSrc="/images/shadow-vault/catalogue-cover.jpg"
            />
            <button
              type="button"
              onClick={scrollToForm}
              className={`${styles.submit} ${styles.btnFull}`}
              style={{ marginTop: '1rem', marginBottom: '.6rem' }}
              aria-label="Proceed to the request form"
            >
              Proceed to Form
            </button>
          </section>

          {/* 🔹 Soft Divider */}
          <div className={styles.dividerSoft} />

          {/* 📝 Section header (polished) */}
          <section className={styles.section}>
            <header className={styles.sectionHeader}>
              <div className={styles.metaRow}>
                <span className={styles.pill}>Black Diamond Edition</span>
                <span className={styles.pillLight}>Intake Portal</span>
              </div>

              <h1 className={styles.sectionTitle}>The Shadow Vault</h1>

              {/* 🔮 Sigil Divider (responsive) */}
              <div className={styles.sigilDivider} aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 12" className={styles.sigilSvg}>
                  <line x1="0" y1="6" x2="32" y2="6" className={styles.sigilLine} />
                  <circle cx="50" cy="6" r="2.2" className={styles.sigilCircle} />
                  <line x1="68" y1="6" x2="100" y2="6" className={styles.sigilLine} />
                </svg>
              </div>

              <ul className={`${styles.sectionPoints} ${styles.measure}`} role="list">
                <li><strong>Review</strong> the catalogue above.</li>
                <li><strong>Specify</strong> the gem, form, and size.</li>
                <li><strong>Submit</strong> your request for curation.</li>
              </ul>
            </header>
          </section>

          {/* 📝 Form */}
          <section id="sv-form" className={styles.section}>
            <header className={styles.formIntro}>
              <h3 className={styles.formIntroTitle}>Submit Your Request</h3>
              <p className={styles.formIntroLead}>
                Precision speeds curation. Share essentials; we’ll follow up for the fine grain.
              </p>
              <div className={styles.hintRow}>
                <span className={styles.hint}>Include dimensions or carats</span>
                <span className={styles.hint}>Format: raw / faceted / cabochon / tumbled</span>
              </div>
            </header>

            {/* Closing sigil to bookend the journey (optional, keep if you like) */}
            <div className={styles.sigilDivider} aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 12" className={styles.sigilSvg}>
                <line x1="0" y1="6" x2="32" y2="6" className={styles.sigilLine} />
                <circle cx="50" cy="6" r="2.2" className={styles.sigilCircle} />
                <line x1="68" y1="6" x2="100" y2="6" className={styles.sigilLine} />
              </svg>
            </div>

            <div className={`${styles.formBox} ${styles.card}`}>
              <div className={styles.zOverlay}>
                <SigilOverlay opacity={0.06} />
              </div>
              <FeaturedGemIntakeForm compact />
            </div>
          </section>

        </div>
      </div>
    </>
  );
}