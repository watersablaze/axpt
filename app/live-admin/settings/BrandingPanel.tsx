'use client';

export default function BrandingPanel() {
  return (
    <div className="settingsPanel">
      <h2>Branding</h2>

      <label>
        Logo URL
        <input type="text" placeholder="/logo.png" />
      </label>

      <label>
        Primary Color
        <input type="color" />
      </label>

      <label>
        Accent Color
        <input type="color" />
      </label>
    </div>
  );
}