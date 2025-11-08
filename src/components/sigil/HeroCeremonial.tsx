'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './HeroCeremonial.module.css';
import IntroRevealGroup from '../ceremony/IntroRevealGroup';

type Props = { onSigilReveal?: () => void };

export default function HeroCeremonial({ onSigilReveal }: Props) {
  const [dimmed, setDimmed] = useState(false);
  const [showReveal, setShowReveal] = useState(false);

useEffect(() => {
  const dimAndRevealTimer = setTimeout(() => {
    setDimmed(true);
    setShowReveal(true);
    console.log('[HeroCeremonial] dim + reveal simultaneous @2.6s');
  }, 2600); // single trigger

  return () => clearTimeout(dimAndRevealTimer);
}, [onSigilReveal]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const continents = document.querySelector(`.${styles.continents}`) as HTMLElement;
      const feathers = document.querySelector(`.${styles.featherGroup}`) as HTMLElement;

      if (continents) continents.style.transform = `translateY(${scrollY * -0.05}px)`;
      if (feathers) feathers.style.transform = `translateY(${scrollY * -0.03}px)`;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.circuitTexture} />

      {/* 🌐 Sigil Core */}
      <div className={`${styles.sigilCore} ${dimmed ? styles.dimmed : ''}`}>
        <div className={styles.leftSigilWrapper}>
          <div className={styles.globeWrapper}>
            <img src="/sigil/axpt_base_clean.png" alt="Globe" className={styles.globe} />
            <img src="/sigil/axpt_continents@2x.webp" alt="Continents" className={styles.continents} />
          </div>

          <img src="/sigil/io@2x.webp" alt=".io Mark" className={styles.ioMark} />

          {['a', 'x', 'p', 't'].map((letter) => (
            <img
              key={letter}
              src={`/sigil/axpt_${letter}@2x.webp`}
              className={`${styles.axptCoreLetter} ${styles[`axpt_${letter}`]}`}
              alt={letter.toUpperCase()}
            />
          ))}

          <div className={styles.featherGroup}>
            {['left', 'right'].flatMap((side) =>
              [1, 2, 3, 4].map((i) => (
                <img
                  key={`${side}-${i}`}
                  src={`/sigil/${side}_feather_${i}@2x.webp`}
                  className={`${styles.feather} ${styles[`pos_${side}${i}`]}`}
                  style={{
                    '--revealDelay': `${side === 'left' ? 1.2 + (i - 1) * 0.15 : 1.3 + (i - 1) * 0.15}s`,
                    '--angle': `${side === 'left' ? -12 + (i - 1) * 4 : 1 + (i - 1) * 3}deg`,
                  } as React.CSSProperties}
                  alt={`${side} Feather ${i}`}
                />
              ))
            )}
          </div>

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
                  style={{ animationDelay: `${1.2 + i * 0.05}s` }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* 💫 Pulse Echo */}
      {showReveal && <div className={styles.pulseEcho} />}
      {/* ⚡ Light Blast — syncs with reveal */}
      {showReveal && <div className={styles.lightFlash} />}

      {/* ✨ Unified Reveal Group */}
      {showReveal && (
        <div className={`${styles.revealGroupWrapper} ${styles.blended}`}>
          <div className={styles.blendGlow} />
          <IntroRevealGroup />
        </div>
      )}

      {/* ⬇️ Scroll Cue */}
      <div className={`${styles.scrollIndicator} ${dimmed ? styles.revealScroll : ''}`}>↓</div>
    </div>
  );
}