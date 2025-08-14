'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import MobileMasthead from './MobileMasthead';
import MobileOrientation from './MobileOrientation';
import MobileProfiles from './MobileProfiles';
import MobileDocumentVault from './MobileDocumentVault';
import SigilWatermark from '../SigilWatermark';
import styles from './VerifiedDashboardMobile.module.css';

import { SessionPayload } from '@/types/auth';

interface VerifiedDashboardMobileProps {
  scrollRef: React.RefObject<HTMLDivElement>;
  tokenPayload: SessionPayload;
}

export default function VerifiedDashboardMobile({
  scrollRef,
  tokenPayload,
}: VerifiedDashboardMobileProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!tokenPayload) {
      console.warn('[AXPT] ❌ No token payload, redirecting...');
      router.replace('/onboard');
    }
  }, [tokenPayload, router]);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrolled) setScrolled(true);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  if (!tokenPayload) {
    return (
      <div className="flex items-center justify-center min-h-screen text-sm text-neutral-400">
        🔐 Stabilizing dashboard interface...
      </div>
    );
  }

  return (
    <>
      {/* 🌌 Cosmic Backgrounds */}
      <div className="axptRadialBackground block sm:hidden" />
      <div
        className="fixed inset-0 z-0 pointer-events-none starfieldLayer block sm:hidden"
        style={{
          backgroundImage: 'url(/images/starfield.png)',
          backgroundRepeat: 'repeat',
          backgroundSize: 'cover',
          animation: 'starDrift 80s linear infinite, starTwinkle 12s ease-in-out infinite',
          mixBlendMode: 'screen',
          opacity: 0.1,
        }}
      />

      {/* ✨ Floating Sigil Guardian */}
      <SigilWatermark scrolled={scrolled} />

      {/* ✨ Glow Overlay */}
      <div className={styles.glowOverlay} />

      {/* 🛏️ Scroll Buffer to Prevent Jump */}
      <div className="h-[8px] w-full" />

      {/* 📱 Scrollable Dashboard */}
      <main
        ref={scrollRef}
        className="relative z-20 snap-y snap-mandatory scroll-smooth overflow-y-auto min-h-screen -webkit-overflow-scrolling-touch"
      >
        <section className="snap-start relative min-h-screen flex flex-col justify-center items-center px-6 py-20">
          <div className="sectionAura aura-1" />
          <MobileMasthead displayName={tokenPayload.displayName} scrollRef={scrollRef} />
        </section>

        <section className="snap-start relative min-h-screen flex flex-col justify-center items-center px-6 py-20">
          <div className="sectionAura aura-2" />
          <MobileOrientation />
        </section>

        <section className="snap-start relative min-h-screen flex flex-col justify-center items-center px-6 py-20">
          <div className="sectionAura aura-3" />
          <MobileProfiles />
        </section>

        <section className="snap-start relative min-h-screen flex flex-col justify-center items-center px-6 py-20">
          <div className="sectionAura aura-4" />
          <MobileDocumentVault />
        </section>
      </main>
    </>
  );
}