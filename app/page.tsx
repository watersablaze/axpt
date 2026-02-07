'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroCeremonial from '@/components/sigil/HeroCeremonial';
import VisionSection from '@/components/sections/VisionSection';
// import NommoMediaSection from '@/components/sections/NommoMediaSection';
// import ShadowVaultSection from '@/components/sections/ShadowVaultSection';
// import TokenContractsSection from '@/components/sections/TokenContractsSection';

export default function Home() {
  return (
    <>
      <Header />

      <main>
        <HeroCeremonial />

        {/* PRIMARY READING SURFACE */}
        <VisionSection />

        {/*
        Uncomment ONE at a time as you refine:

        <NommoMediaSection />
        <ShadowVaultSection />
        <TokenContractsSection />
        */}
      </main>

      <Footer />
    </>
  );
}