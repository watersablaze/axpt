'use client';

import { useEffect, useState } from 'react';
import styles from './NebulaField.module.css';

const orbSrc = '/images/backgrounds/violet_nebula.webp';

export default function NebulaField() {
  const [visible, setVisible] = useState(false);
  const [animationDuration, setAnimationDuration] = useState('28s');

  useEffect(() => {
    const delayStr = getComputedStyle(document.documentElement)
      .getPropertyValue('--nebula-fade-delay')
      .trim();

    const delayMs = parseFloat(delayStr) * 1000 || 2000;
    const timer = setTimeout(() => setVisible(true), delayMs);

    // Randomize animation duration slightly
    const randomizedDuration = 28 + Math.random() * 6;
    setAnimationDuration(`${randomizedDuration}s`);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
  const handleScroll = () => {
    const scrollY = window.scrollY;
    const field = document.querySelector(`.${styles.field}`);
    if (field instanceof HTMLElement) {
      field.style.opacity = `${Math.max(1 - scrollY / 800, 0.1)}`;
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

  return (
    <div className={`${styles.field} ${visible ? styles.fadeIn : ''}`}>
      {/* Primary Orb */}
      <img
        src={orbSrc}
        alt="Nebula Orb"
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        className={styles.centralOrb}
        style={{ animationDuration }}
      />

      {/* Secondary Mist Layer */}
      <img
        src={orbSrc}
        alt="Nebula Mist"
        className={styles.secondaryMist}
      />

      {/* Secondary Rotating Glow */}
      <img
        src={orbSrc}
        alt="Nebula Glow"
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        className={styles.secondaryOrb}
      />
    </div>
  );
}