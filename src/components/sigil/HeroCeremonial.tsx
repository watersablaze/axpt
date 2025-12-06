'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './HeroCeremonial.module.css';
import { usePerformanceMode } from '@/hooks/usePerformanceMode';

// ⚡ Lazy-load reveal group for performance
const IntroRevealGroup = dynamic(
  () => import('../ceremony/IntroRevealGroup'),
  { ssr: false, loading: () => null }
);

type Props = { onSigilReveal?: () => void };

export default function HeroCeremonial({ onSigilReveal }: Props) {
  const [dimmed, setDimmed] = useState(false);
  const [showReveal, setShowReveal] = useState(false);

  // 🌡 Performance-aware timing (low/medium/high)
  const performanceMode = usePerformanceMode();

  /* ---------------------------------------------------------
     🎬 Ceremony Intro Timing
     --------------------------------------------------------- */
  useEffect(() => {
    let revealDelay = 2400;

    if (performanceMode === 'medium') {
      revealDelay = 2600;
    } else if (performanceMode === 'low') {
      revealDelay = 3000;
    }

    const timer = setTimeout(() => {
      setDimmed(true);
      setShowReveal(true);
      onSigilReveal?.();
    }, revealDelay);

    return () => clearTimeout(timer);
  }, [performanceMode, onSigilReveal]);

  /* ---------------------------------------------------------
     ♻ Ceremony Reset (from CeremonyControlPanel)
     --------------------------------------------------------- */
  useEffect(() => {
    const handler = () => {
      window.scrollTo(0, 0);
      setDimmed(false);
      setShowReveal(false);

      // Restart slight delay to allow class removal to settle
      setTimeout(() => {
        setDimmed(true);
        setShowReveal(true);
      }, 50);
    };

    window.addEventListener('ceremonyReset', handler);
    return () => window.removeEventListener('ceremonyReset', handler);
  }, []);

  /* ---------------------------------------------------------
     🌬 Parallax effect on scroll
     --------------------------------------------------------- */
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;

      const continents = document.querySelector(
        `.${styles.continents}`
      ) as HTMLElement | null;

      const feathers = document.querySelector(
        `.${styles.featherGroup}`
      ) as HTMLElement | null;

      if (continents) {
        continents.style.transform = `translateY(${y * -0.04}px)`;
      }

      if (feathers) {
        feathers.style.transform = `translateY(${y * -0.025}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ---------------------------------------------------------
     ✨ RENDER
     --------------------------------------------------------- */
  return (
    <div className={styles.container}>
      <div className={styles.circuitTexture} />

      {/* 🌐 Sigil Core */}
      <div className={`${styles.sigilCore} ${dimmed ? styles.dimmed : ''}`}>
        <div className={styles.leftSigilWrapper}>
          {/* Globe */}
          <div className={styles.globeWrapper}>
            <img
              src="/sigil/axpt_base_clean.png"
              alt="Globe"
              className={styles.globe}
              loading="eager"
            />
            <img
              src="/sigil/axpt_continents@2x.webp"
              alt="Continents"
              className={styles.continents}
              loading="eager"
            />
          </div>

          {/* IO Mark */}
          <img
            src="/sigil/io@2x.webp"
            alt=".io Mark"
            className={styles.ioMark}
            loading="eager"
          />

          {/* AXPT letters */}
          {['a', 'x', 'p', 't'].map((letter) => (
            <img
              key={letter}
              src={`/sigil/axpt_${letter}@2x.webp`}
              className={`${styles.axptCoreLetter} ${styles[`axpt_${letter}`]}`}
              alt={letter.toUpperCase()}
              loading="eager"
            />
          ))}

          {/* Feathers */}
          <div className={styles.featherGroup}>
            {['left', 'right'].flatMap((side) =>
              [1, 2, 3, 4].map((i) => (
                <img
                  key={`${side}-${i}`}
                  src={`/sigil/${side}_feather_${i}@2x.webp`}
                  className={`${styles.feather} ${styles[`pos_${side}${i}`]}`}
                  style={{
                    '--revealDelay': `${
                      side === 'left'
                        ? 1.1 + (i - 1) * 0.14
                        : 1.2 + (i - 1) * 0.14
                    }s`,
                    '--angle': `${
                      side === 'left'
                        ? -12 + (i - 1) * 4
                        : 1 + (i - 1) * 3
                    }deg`,
                  } as React.CSSProperties}
                  alt={`${side} Feather ${i}`}
                  loading="lazy"
                />
              ))
            )}
          </div>

          {/* AXISPOINT Wing Letters */}
          <div className={styles.axisGroup}>
            {['a', 'x', 'i1', 's', 'p', 'o', 'i2', 'n', 't'].map((key, i) => {
              const src =
                key === 'i1'
                  ? '/sigil/i_wing@2x_2.webp'
                  : key === 'i2'
                  ? '/sigil/i_2_wing@2x.webp'
                  : `/sigil/${key}_wing@2x.webp`;

              return (
                <img
                  key={key}
                  src={src}
                  className={`${styles.axisWingLetter} ${styles[`axis_${key}`]}`}
                  alt={key.toUpperCase()}
                  loading="lazy"
                  style={{ animationDelay: `${1 + i * 0.05}s` }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* 💫 Pulse Layers */}
      {showReveal && (
        <>
          <div className={styles.pulseEcho} />
          <div className={styles.lightFlash} />
        </>
      )}

      {/* ✨ Unified Reveal Group */}
      {showReveal && (
        <div className={`${styles.revealGroupWrapper} ${styles.blended}`}>
          <div className={styles.blendGlow} />
          <IntroRevealGroup />
        </div>
      )}

      {/* Scroll Cue */}
      <div className={`${styles.scrollIndicator} ${dimmed ? styles.revealScroll : ''}`}>
        ↓
      </div>
    </div>
  );
}