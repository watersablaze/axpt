// 📁 components/shared/ParticleOverlay.tsx
'use client';

import container from './ParticleOverlay.module.css';
import sparkles from './sparkles.module.css';
import ripples from './ripples.module.css';

export default function ParticleOverlay() {
  return (
    <div className={container.overlayWrapper}>
      {/* 🌟 Floating sparkle specks */}
      <div className={`${sparkles.sparkle} ${sparkles.tiny} ${sparkles.one} ${sparkles.gold}`} />
      <div className={`${sparkles.sparkle} ${sparkles.medium} ${sparkles.two} ${sparkles.violet}`} />
      <div className={`${sparkles.sparkle} ${sparkles.large} ${sparkles.three} ${sparkles.blue}`} />
      <div className={`${sparkles.sparkle} ${sparkles.medium} ${sparkles.four}`} />
      <div className={`${sparkles.sparkle} ${sparkles.tiny} ${sparkles.five} ${sparkles.violet}`} />
      <div className={`${sparkles.sparkle} ${sparkles.medium} ${sparkles.six} ${sparkles.gold}`} />
      <div className={`${sparkles.sparkle} ${sparkles.tiny} ${sparkles.seven}`} />
      <div className={`${sparkles.sparkle} ${sparkles.large} ${sparkles.eight} ${sparkles.blue}`} />
      <div className={`${sparkles.sparkle} ${sparkles.medium} ${sparkles.nine} ${sparkles.gold}`} />
      <div className={`${sparkles.sparkle} ${sparkles.tiny} ${sparkles.ten} ${sparkles.violet}`} />

      {/* 🌊 Expanding energy ripple rings */}
      <div className={ripples.energyRipple} />
      <div className={`${ripples.energyRipple} ${ripples.delayed}`} />
    </div>
  );
}