'use client';

export default function StreamControls() {
  return (
    <div className="streamControls">
      <h3>Actions</h3>

      <button className="primaryBtn">Refresh Stream Status</button>

      <button className="dangerBtn">Force Stream Reset (Admin)</button>

      <h4>Tools</h4>
      <ul>
        <li>OBS WebSocket Helper</li>
        <li>Ingest Endpoint Debugger</li>
        <li>Latency Checker</li>
        <li>Sync Audio/Video Tester</li>
      </ul>
    </div>
  );
}