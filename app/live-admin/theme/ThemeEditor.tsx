'use client';

import type { ThemePreset } from './theme-data';

interface ThemeEditorProps {
  theme: ThemePreset;
  onUpdate: (t: ThemePreset) => void;
}

export default function ThemeEditor({ theme, onUpdate }: ThemeEditorProps) {
  const handleChange = (group: keyof ThemePreset, key: string, value: any) => {
    onUpdate({
      ...theme,
      [group]: {
        ...(theme as any)[group],
        [key]: value,
      },
    });
  };

  return (
    <div className="themeEditor">
      <h2>Theme Editor</h2>

      <section>
        <h3>Colors</h3>

        {Object.keys(theme.colors).map((k) => (
          <label key={k} className="themeLabel">
            {k}
            <input
              type="color"
              value={(theme.colors as any)[k]}
              onChange={(e) => handleChange('colors', k, e.target.value)}
            />
          </label>
        ))}
      </section>

      <section>
        <h3>Typography</h3>

        <label>
          Font Family
          <input
            type="text"
            value={theme.typography.fontFamily}
            onChange={(e) =>
              handleChange('typography', 'fontFamily', e.target.value)
            }
          />
        </label>

        <label>
          Weight
          <input
            type="range"
            min={300}
            max={900}
            step={100}
            value={theme.typography.weight}
            onChange={(e) =>
              handleChange('typography', 'weight', Number(e.target.value))
            }
          />
        </label>
      </section>

      <section>
        <h3>Motion</h3>
        <label>
          Ease Curve
          <input
            type="text"
            value={theme.motion.ease}
            onChange={(e) =>
              handleChange('motion', 'ease', e.target.value)
            }
          />
        </label>

        <label>
          Duration (s)
          <input
            type="number"
            min={0.1}
            max={2}
            step={0.05}
            value={theme.motion.duration}
            onChange={(e) =>
              handleChange('motion', 'duration', Number(e.target.value))
            }
          />
        </label>
      </section>

      <section>
        <h3>Radii</h3>
        {Object.keys(theme.radii).map((k) => (
          <label key={k}>
            {k}
            <input
              type="text"
              value={(theme.radii as any)[k]}
              onChange={(e) =>
                handleChange('radii', k, e.target.value)
              }
            />
          </label>
        ))}
      </section>
    </div>
  );
}