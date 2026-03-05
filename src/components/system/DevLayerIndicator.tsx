'use client';

import { useLayer } from '@/lib/context/LayerContext';

const DISPLAY_LAYER: Record<string, string> = {
  ENTRY: 'ENTRY',
  FOUNDATION: 'FOUNDATION',
  FRAMEWORK: 'FRAMEWORK',
  INTERFACES: 'INTERFACES',
  ETHOS: 'CIRCULATION',  // optional but nice (matches your kicker)
  PRESENCE: 'SEAL',      // ✅ this is the key change
};

export default function GlobalLayerIndicator() {
  const { activeLayer } = useLayer();
  const label = DISPLAY_LAYER[activeLayer] ?? activeLayer;

  return <div className="globalLayerIndicator">{label} — ACTIVE</div>;
}