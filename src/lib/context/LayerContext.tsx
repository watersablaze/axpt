'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type LayerName =
  | 'ENTRY'
  | 'FOUNDATION'
  | 'FRAMEWORK'
  | 'INTERFACES'
  | 'ETHOS'
  | 'PRESENCE';

type LayerContextType = {
  activeLayer: string; // ← keep flexible
  setActiveLayer: (layer: string) => void;
};

const LayerContext = createContext<LayerContextType | null>(null);

function getFieldTokens(layer: string) {
  switch (layer) {
    case 'ENTRY':
      return { a: 0.14, b: 0.07, s: 1.05, blur: 0.75 };
    case 'FOUNDATION':
      return { a: 0.15, b: 0.08, s: 1.05, blur: 0.75 };
    case 'FRAMEWORK':
      return { a: 0.16, b: 0.08, s: 1.06, blur: 0.72 };
    case 'INTERFACES':
      return { a: 0.17, b: 0.09, s: 1.07, blur: 0.70 };
    case 'ETHOS':
      return { a: 0.15, b: 0.08, s: 1.05, blur: 0.74 };
    case 'PRESENCE':
      return { a: 0.13, b: 0.06, s: 1.04, blur: 0.85 };
    default:
      return { a: 0.16, b: 0.09, s: 1.06, blur: 1.1 };
  }
}

export function LayerProvider({ children }: { children: React.ReactNode }) {
  const [activeLayer, setActiveLayer] = useState<string>('ENTRY');

 useEffect(() => {
  const root = document.documentElement;
  root.setAttribute('data-layer', activeLayer);

  const base = getFieldTokens(activeLayer);

  // baseline
  root.style.setProperty('--field-current-alpha', String(base.a));
  root.style.setProperty('--field-current-blur', `${base.blur}px`);

  // --- SUBSURFACE SWELL ---
  const burstAlpha = base.a + 0.015;       // very small lift
  const burstBlur  = base.blur + 0.35;     // more diffusion instead of brightness

  root.style.setProperty('--field-current-alpha', String(burstAlpha));
  root.style.setProperty('--field-current-blur', `${burstBlur}px`);

  const settle = setTimeout(() => {
    root.style.setProperty('--field-current-alpha', String(base.a));
    root.style.setProperty('--field-current-blur', `${base.blur}px`);
  }, 180);

  return () => clearTimeout(settle);
}, [activeLayer]);

  const value = useMemo(() => ({ activeLayer, setActiveLayer }), [activeLayer]);

  return <LayerContext.Provider value={value}>{children}</LayerContext.Provider>;
}

export function useLayer() {
  const ctx = useContext(LayerContext);
  if (!ctx) throw new Error('useLayer must be used inside LayerProvider');
  return ctx;
}