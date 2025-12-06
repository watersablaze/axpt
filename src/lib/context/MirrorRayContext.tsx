'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

// The three sacred states of perception
export type UIMode = 'oracle' | 'elder' | 'nommo';

type MirrorRayContextType = {
  color: string;
  setColor: (c: string) => void;

  uiMode: UIMode;
  setUIMode: (m: UIMode) => void;

  modeLabel: string;
  modeDescription: string;

  // For other systems (ceremony, performance oracle)
  isOracle: boolean;
  isElder: boolean;
  isNommo: boolean;
};

const MirrorRayContext = createContext<MirrorRayContextType | null>(null);

export const MirrorRayProvider = ({ children }: { children: ReactNode }) => {
  const [color, setColor] = useState('#00ffbf');

  // Load UI mode from storage (persists across sessions)
  const [uiMode, setUIMode] = useState<UIMode>('oracle');

  useEffect(() => {
    const stored = localStorage.getItem('axpt-ui-mode');
    if (stored === 'oracle' || stored === 'elder' || stored === 'nommo') {
      setUIMode(stored);
    }
  }, []);

  // Persist mode selection
  useEffect(() => {
    localStorage.setItem('axpt-ui-mode', uiMode);
  }, [uiMode]);

  useEffect(() => {
  document.documentElement.setAttribute('data-ui-mode', uiMode);
}, [uiMode]);

  const descriptiveMap: Record<UIMode, { label: string; desc: string }> = {
    oracle: {
      label: 'Oracle Mode',
      desc: 'Full-spectrum ceremonial + technical awareness. All systems revealed.',
    },
    elder: {
      label: 'Elder Mode',
      desc: 'Governance clarity with reduced motion + simplified system display.',
    },
    nommo: {
      label: 'Nommo Mode',
      desc: 'Engineer-only debugging space. Minimal bloom. Fastest timings.',
    },
  };

  return (
    <MirrorRayContext.Provider
      value={{
        color,
        setColor,
        uiMode,
        setUIMode,
        modeLabel: descriptiveMap[uiMode].label,
        modeDescription: descriptiveMap[uiMode].desc,
        isOracle: uiMode === 'oracle',
        isElder: uiMode === 'elder',
        isNommo: uiMode === 'nommo',
      }}
    >
      {children}
    </MirrorRayContext.Provider>
  );
};

export const useMirrorRay = () => {
  const ctx = useContext(MirrorRayContext);
  if (!ctx) throw new Error('useMirrorRay must be used within provider');
  return ctx;
};