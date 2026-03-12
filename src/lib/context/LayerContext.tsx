'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { LayerName } from '@/types/layers';

type LayerContextType = {
  activeLayer: LayerName;
  setActiveLayer: (layer: LayerName) => void;
};

const LayerContext = createContext<LayerContextType | null>(null);

function getFieldTokens(layer: LayerName) {
  switch (layer) {
    case 'ENTRY':
      return { a: 0.14, blur: 0.75 };
    case 'FOUNDATION':
      return { a: 0.15, blur: 0.75 };
    case 'FRAMEWORK':
      return { a: 0.16, blur: 0.72 };
    case 'INTERFACES':
      return { a: 0.17, blur: 0.70 };
    case 'ETHOS':
      return { a: 0.15, blur: 0.74 };
    case 'PRESENCE':
      return { a: 0.13, blur: 0.85 };
    default:
      return { a: 0.16, blur: 1.1 };
  }
}

export function LayerProvider({ children }: { children: React.ReactNode }) {

  const [activeLayer, setActiveLayer] = useState<LayerName>('ENTRY');

  useEffect(() => {

    const body = document.body;

    body.setAttribute('data-layer', activeLayer);

    // axis resonance propagation
    body.classList.add('axis-resonance');

    setTimeout(() => {
      body.classList.remove('axis-resonance');
    }, 900);

    const base = getFieldTokens(activeLayer);

    // baseline
    body.style.setProperty('--field-current-alpha', String(base.a));
    body.style.setProperty('--field-current-blur', `${base.blur}px`);

    // subsurface swell
    const burstAlpha = base.a + 0.015;
    const burstBlur = base.blur + 0.35;

    body.style.setProperty('--field-current-alpha', String(burstAlpha));
    body.style.setProperty('--field-current-blur', `${burstBlur}px`);

    const settle = setTimeout(() => {
      body.style.setProperty('--field-current-alpha', String(base.a));
      body.style.setProperty('--field-current-blur', `${base.blur}px`);
    }, 180);

    return () => clearTimeout(settle);

  }, [activeLayer]);

  const value = useMemo(
    () => ({ activeLayer, setActiveLayer }),
    [activeLayer]
  );

  return (
    <LayerContext.Provider value={value}>
      {children}
    </LayerContext.Provider>
  );
}

export function useLayer() {
  const ctx = useContext(LayerContext);
  if (!ctx) throw new Error('useLayer must be used inside LayerProvider');
  return ctx;
}