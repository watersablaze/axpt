// src/components/sections/ShadowVaultSection.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SectionTemplate from './SectionTemplate';
import GemBackdrop from './GemBackdrop';
import styles from './ShadowVaultSection.module.css';

export default function ShadowVaultSection() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 6000); // match veil fade
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={visible ? 'sectionVisible' : ''}>
      <SectionTemplate
        id="vault"
        title="The Shadow Vault"
        description="A hidden archive of frequency signatures, visions, and encrypted gems. Guarded by thresholds of resonance."
        visual={<GemBackdrop />}
      >
        <Link href="/french-ward/shadow-vault">
          <button className={styles.vaultButton}>Enter the Vault</button>
        </Link>
      </SectionTemplate>
    </div>
  );
}