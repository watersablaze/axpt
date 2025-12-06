'use client';

import type { OverlayConfig } from './overlay-types';

interface Props {
  overlay: OverlayConfig | null;
  onUpdate: (cfg: OverlayConfig) => void;
}

export default function OverlayControls({ overlay, onUpdate }: Props) {
  if (!overlay)
    return <div className="overlayControls">Select an overlay to edit.</div>;

  const updateProp = (key: string, value: any) => {
    onUpdate({
      ...overlay,
      props: { ...overlay.props, [key]: value },
    });
  };

  return (
    <div className="overlayControls">
      <h2>{overlay.name}</h2>

      <label>
        X Position
        <input
          type="range"
          min={0}
          max={100}
          value={overlay.props.x ?? 50}
          onChange={(e) => updateProp('x', Number(e.target.value))}
        />
      </label>

      <label>
        Y Position
        <input
          type="range"
          min={0}
          max={100}
          value={overlay.props.y ?? 50}
          onChange={(e) => updateProp('y', Number(e.target.value))}
        />
      </label>

      <label>
        Opacity
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={overlay.props.opacity ?? 1}
          onChange={(e) => updateProp('opacity', Number(e.target.value))}
        />
      </label>
    </div>
  );
}