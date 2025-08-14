'use client';

import { useState } from 'react';
import styles from './ShadowVaultForm.module.css';
import ShadowVaultHero from '@/components/french-ward/ShadowVaultHero';
import FeaturedGemSection from '@/components/french-ward/FeaturedGemSection';
import CatalogueViewer from '@/components/vault/CatalogueViewer';
import FadeInOnView from '@/components/animation/FadeInOnView';
import SigilOverlay from '@/components/visual/SigilOverlay'; // 
import FeaturedGemIntakeForm from '@/components/forms/FeaturedGemIntakeForm'

export default function ShadowVaultPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    desiredGem: '',
    format: '',
    size: '',
    quantity: '',
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/shadow-vault/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      alert(data.message);
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  return (
    <>
      <ShadowVaultHero />

      <div className={styles.container}>
        <div className={styles.inner}>

          {/* ✨ Ceremonial Gem Display */}
          <FeaturedGemSection />

          {/* 📜 Vault Catalogue Viewer + Fade Reveal */}
          <section style={{ position: 'relative' }}>
            <FadeInOnView delay={250}>
              <CatalogueViewer />
            </FadeInOnView>
          </section>

          {/* Intake Form Instruction */}
          <div className="mb-6">
            <h1 className={styles.title}>The Shadow Vault</h1>
            <p className={styles.subtitle}>
              Black Diamond Edition | Rare Gem & Mineral Intake | Kindly fill the fields with care.
              Your request will be reviewed and sealed into the Shadow Vault archive.
            </p>
          </div>

          {/* 🜃 Form with sigil ceremony beneath */}
          <div className={styles.formBox} style={{ position: 'relative', overflow: 'hidden' }}>
            <SigilOverlay />
            <FeaturedGemIntakeForm />
          </div>

        </div>
      </div>
    </>
  );
}
