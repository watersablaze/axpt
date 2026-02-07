'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroCeremonial from '@/components/sigil/HeroCeremonial';
import VisionSection from '@/components/sections/VisionSection';
import NommoMediaSection from '@/components/sections/NommoMediaSection';
import ShadowVaultSection from '@/components/sections/ShadowVaultSection';
import TokenContractsSection from '@/components/sections/TokenContractsSection';
import CircuitTextureOverlay from '@/components/decor/CircuitTextureOverlay';
import NebulaOverlay from '@/components/background/NebulaOverlay';
import dynamic from 'next/dynamic';

const LayoutDebugger =
  process.env.NODE_ENV === 'development'
    ? dynamic(() => import('@/components/debug/LayoutDebugger'), { ssr: false })
    : () => null;

export default function Home() {
  const [sigilRevealed, setSigilRevealed] = useState(false);

  return (
    <>
    <CircuitTextureOverlay />
    <NebulaOverlay />
      <HeroCeremonial onSigilReveal={() => setSigilRevealed(true)} />

      {/* 👁‍🗨 Page content is blurred until sigil is revealed */}
      <div className={`pageContent ${sigilRevealed ? 'revealed' : ''}`}>
        <Header />
        <main className="responsivePageContainer">
          <VisionSection />
          <NommoMediaSection />
          <ShadowVaultSection />
          <TokenContractsSection />
        </main>
        <Footer />
      </div>

      <LayoutDebugger />
    </>
  );
}