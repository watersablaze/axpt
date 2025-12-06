'use client';

export default function ModerationPanel() {
  return (
    <div className="settingsPanel">
      <h2>Moderation Rules</h2>

      <label>
        <input type="checkbox" /> Auto-filter NSFW
      </label>
      <label>
        <input type="checkbox" /> Hide spam
      </label>
      <label>
        <input type="checkbox" /> Block bots
      </label>
    </div>
  );
}