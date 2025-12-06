'use client';

import type { OverlayConfig } from './overlay-types';

export default function OverlayPreview({
  overlays,
}: {
  overlays: OverlayConfig[];
}) {
  return (
    <div className="overlayPreview">
      {overlays.map((o) => (
        <div
          key={o.id}
          className={`overlayItem overlay-${o.type}`}
          style={{
            left: `${o.props.x ?? 50}%`,
            top: `${o.props.y ?? 50}%`,
            opacity: o.props.opacity ?? 1,
            transform: 'translate(-50%, -50%)',
            position: 'absolute',
          }}
        >
          {o.name}
        </div>
      ))}
    </div>
  );
}