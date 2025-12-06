'use client';

export default function StreamingPanel() {
  return (
    <div className="settingsPanel">
      <h2>Streaming Configuration</h2>

      <label>
        Stream Server
        <input type="text" placeholder="rtmp://server/live" />
      </label>

      <label>
        Stream Key
        <input type="password" placeholder="••••••••••••" />
      </label>
    </div>
  );
}