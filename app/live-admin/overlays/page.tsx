'use client';

import { useState } from 'react';
import OverlayPreview from './OverlayPreview';
import OverlayControls from './OverlayControls';
import type { OverlayConfig } from './overlay-types';

export default function OverlaysPage() {
  const [overlays, setOverlays] = useState<OverlayConfig[]>([
    { id: 'lt1', name: 'Lower Third', type: 'lower-third', props: { x: 50, y: 80 } },
    { id: 'logo1', name: 'Logo Badge', type: 'logo', props: { x: 10, y: 10 } },
  ]);

  const [selected, setSelected] = useState<OverlayConfig | null>(null);

  const updateOverlay = (cfg: OverlayConfig) => {
    setOverlays((prev) =>
      prev.map((o) => (o.id === cfg.id ? cfg : o))
    );
    setSelected(cfg);
  };

  return (
    <div className="overlaysPage">
      <h1>Overlays</h1>

      <div className="overlayGrid">
        <div className="previewPane">
          <OverlayPreview overlays={overlays} />
        </div>

        <div className="controlsPane">
          <div className="overlayList">
            {overlays.map((o) => (
              <button
                key={o.id}
                className="overlayBtn"
                onClick={() => setSelected(o)}
              >
                {o.name}
              </button>
            ))}
          </div>

          <OverlayControls
            overlay={selected}
            onUpdate={updateOverlay}
          />
        </div>
      </div>
    </div>
  );
}