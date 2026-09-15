'use client';

import { useLayer } from '@/lib/context/LayerContext';

const DISPLAY_LAYER: Record<string, string> = {
  ENTRY: 'ENTRY',
  FOUNDATION: 'FOUNDATION',
  FRAMEWORK: 'FRAMEWORK',
  INTERFACES: 'INTERFACES',
  ETHOS: 'CIRCULATION',
  FRENCH_WARD: 'FRENCH-WARD',
  PRESENCE: 'SEAL',
};

export default function DevLayerIndicator() {
  const { activeLayer } = useLayer();
  const label = DISPLAY_LAYER[activeLayer] ?? activeLayer;

  return <div className="globalLayerIndicator">{label} — ACTIVE</div>;
}