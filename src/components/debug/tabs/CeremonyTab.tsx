'use client';

import { useState, useEffect } from 'react';

interface CeremonyControls {
  revealStage: string;
  setRevealStage: (s: string) => void;

  autoSequence: boolean;
  setAutoSequence: (b: boolean) => void;

  veilLiftTime: number;
  setVeilLiftTime: (n: number) => void;

  sigilDimTime: number;
  setSigilDimTime: (n: number) => void;

  forceReset: () => void;
}

export default function CeremonyTab() {
  // Ceremony State
  const [revealStage, setRevealStage] = useState('idle'); // idle → sigil → veil → dim → form
  const [autoSequence, setAutoSequence] = useState(true);
  const [veilLiftTime, setVeilLiftTime] = useState(8200);
  const [sigilDimTime, setSigilDimTime] = useState(8800);

  // Load saved values on mount
  useEffect(() => {
    const savedReveal = localStorage.getItem('ceremony-reveal');
    const savedAuto = localStorage.getItem('ceremony-auto');
    const savedVeil = localStorage.getItem('ceremony-veil');
    const savedDim = localStorage.getItem('ceremony-dim');

    if (savedReveal) setRevealStage(savedReveal);
    if (savedAuto) setAutoSequence(savedAuto === 'true');
    if (savedVeil) setVeilLiftTime(parseInt(savedVeil));
    if (savedDim) setSigilDimTime(parseInt(savedDim));
  }, []);

  // Save automatically
  useEffect(() => {
    localStorage.setItem('ceremony-reveal', revealStage);
  }, [revealStage]);

  useEffect(() => {
    localStorage.setItem('ceremony-auto', autoSequence.toString());
  }, [autoSequence]);

  useEffect(() => {
    localStorage.setItem('ceremony-veil', veilLiftTime.toString());
  }, [veilLiftTime]);

  useEffect(() => {
    localStorage.setItem('ceremony-dim', sigilDimTime.toString());
  }, [sigilDimTime]);

  // Force reset event
  const forceReset = () => {
    window.dispatchEvent(new CustomEvent('ceremonyReset'));
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      padding: '0.5rem 0.2rem'
    }}>

      {/* Reveal Stage Debug */}
      <div>
        <label style={{ fontSize: '0.85rem', opacity: 0.85 }}>
          Reveal Stage
        </label>
        <select
          value={revealStage}
          onChange={(e) => setRevealStage(e.target.value)}
          style={{
            width: '100%',
            padding: '0.3rem',
            borderRadius: 6,
            background: '#111',
            color: '#fff',
            border: '1px solid #333'
          }}
        >
          <option value="idle">Idle</option>
          <option value="sigil">Sigil Reveal</option>
          <option value="veil">Veil Lift</option>
          <option value="dim">Sigil Dim</option>
          <option value="form">Form Visible</option>
        </select>
      </div>

      {/* Auto Sequence Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="checkbox"
          checked={autoSequence}
          onChange={(e) => setAutoSequence(e.target.checked)}
        />
        <span style={{ fontSize: '0.85rem', opacity: 0.85 }}>
          Auto Ceremony Sequence
        </span>
      </div>

      {/* Veil Lift Timing */}
      <div>
        <label style={{ fontSize: '0.85rem', opacity: 0.85 }}>
          Veil Lift Time: {veilLiftTime}ms
        </label>
        <input
          type="range"
          min="1000"
          max="15000"
          value={veilLiftTime}
          step={100}
          onChange={(e) => setVeilLiftTime(parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Sigil Dim Timing */}
      <div>
        <label style={{ fontSize: '0.85rem', opacity: 0.85 }}>
          Sigil Dim Time: {sigilDimTime}ms
        </label>
        <input
          type="range"
          min="2000"
          max="18000"
          value={sigilDimTime}
          step={100}
          onChange={(e) => setSigilDimTime(parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Reset Button */}
      <button
        onClick={forceReset}
        style={{
          padding: '0.4rem 0.6rem',
          background: '#4411ff',
          borderRadius: 6,
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          marginTop: '0.6rem',
          fontSize: '0.85rem'
        }}
      >
        Reset Ceremony
      </button>
    </div>
  );
}