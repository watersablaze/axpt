'use client';

import styles from './ShadowVaultForm.module.css';
import ShadowVaultHero from '@/components/french-ward/ShadowVaultHero';
import FeaturedGemSection from '@/components/french-ward/FeaturedGemSection';
import FadeInOnView from '@/components/animation/FadeInOnView';
import SigilOverlay from '@/components/visual/SigilOverlay';
import FeaturedGemIntakeForm from '@/components/forms/FeaturedGemIntakeForm';
import dynamic from 'next/dynamic';

const CatalogueViewer = dynamic(() => import('@/components/vault/CatalogueViewer'), { ssr: false });

export default function ShadowVaultPage() {
  return (
    <>
      <ShadowVaultHero />

      {/* scroll target for hero cue */}
      <div id="after-hero" />

      <div className={styles.container}>
        <div className={styles.inner}>
          <FeaturedGemSection />

          <section style={{ position: 'relative' }}>
            <FadeInOnView delay={250}>
              <CatalogueViewer
                src="/docs/shadow-vault/shadow-vault-catalogue.pdf"
                title="Shadow Vault Catalogue"
                downloadLabel="Download PDF"
                downloadFileName="shadow-vault-catalogue.pdf"
                showHeaderActions
              />
            </FadeInOnView>
          </section>

          {/* Title + responsive sigil divider */}
          <div className="mb-6">
            <h1 className={styles.title}>The Shadow Vault</h1>

            <div className={styles.sigilDivider} aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 12" className={styles.sigilSvg}>
                <line x1="0" y1="6" x2="32" y2="6" className={styles.sigilLine} />
                <circle cx="50" cy="6" r="2.2" className={styles.sigilCircle} />
                <line x1="68" y1="6" x2="100" y2="6" className={styles.sigilLine} />
              </svg>
            </div>

            <p className={styles.subtitle}>
              Black Diamond Edition | Rare Gem &amp; Mineral Intake — choose format (raw, faceted, cabochon, tumbled), then provide size and notes.
            </p>
          </div>

          <div className={styles.formBox} style={{ position: 'relative', overflow: 'hidden' }}>
            <SigilOverlay />
            <FeaturedGemIntakeForm />
          </div>
        </div>
      </div>
    </>
  );
}