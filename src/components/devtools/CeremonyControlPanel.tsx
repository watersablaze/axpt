'use client';

import { useEffect, useState } from 'react';
import styles from './CeremonyControlPanel.module.css';

export default function CeremonyControlPanel() {
  const [bloom, setBloom] = useState(1);
  const [revealDelay, setRevealDelay] = useState(2.6);
  const [trigger, setTrigger] = useState(0);
  const [visible, setVisible] = useState(false);

  // 🌼 Load saved values on mount
  useEffect(() => {
    const savedBloom = localStorage.getItem('bloomStrength');
    const savedDelay = localStorage.getItem('sigilRevealDelay');
    if (savedBloom) setBloom(parseFloat(savedBloom));
    if (savedDelay) setRevealDelay(parseFloat(savedDelay));
  }, []);

  // 💡 Apply bloom variable globally
  useEffect(() => {
    document.documentElement.style.setProperty('--bloom-strength', bloom.toString());
    localStorage.setItem('bloomStrength', bloom.toString());
  }, [bloom]);

  // 🕰 Apply reveal delay variable globally
  useEffect(() => {
    document.documentElement.style.setProperty('--sigil-reveal-delay', `${revealDelay}s`);
    localStorage.setItem('sigilRevealDelay', revealDelay.toString());
  }, [revealDelay]);

// 🔁 Trigger re-animation
const reTriggerAnimation = () => {
  setTrigger(t => t + 1);
  const hero = document.querySelector('.HeroCeremonialRoot') as HTMLElement | null;
  if (hero) {
    hero.classList.remove('rerun');
    // 👇 Type-safe reflow trigger
    void hero.offsetWidth;
    hero.classList.add('rerun');
  }
};

  // 🎚️ Keyboard toggle (⌘ + \  or  Ctrl + \)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === '\\') {
        e.preventDefault();
        setVisible(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.panel}>
      <h3 className={styles.heading}>🌙 Ceremony Control</h3>

      {/* Bloom Strength */}
      <label className={styles.label}>
        Bloom Strength <span>{bloom.toFixed(2)}</span>
        <input
          className={styles.rangeInput}
          type="range"
          min="0.3"
          max="2.0"
          step="0.1"
          value={bloom}
          onChange={e => setBloom(parseFloat(e.target.value))}
        />
      </label>

      {/* Reveal Delay */}
      <label className={styles.label}>
        Reveal Delay (s) <span>{revealDelay.toFixed(1)}</span>
        <input
          className={styles.rangeInput}
          type="range"
          min="1.5"
          max="5.0"
          step="0.1"
          value={revealDelay}
          onChange={e => setRevealDelay(parseFloat(e.target.value))}
        />
      </label>

      <div className={styles.buttonRow}>
        <button className={styles.button} onClick={reTriggerAnimation}>
          Re-run Ceremony
        </button>
        <button
          className={`${styles.button} ${styles.secondary}`}
          onClick={() => {
            setBloom(1);
            setRevealDelay(2.6);
          }}
        >
          Reset Defaults
        </button>
      </div>
    </div>
  );
}