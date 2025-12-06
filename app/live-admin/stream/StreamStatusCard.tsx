'use client';

import type { StreamStatus } from './stream-types';

export default function StreamStatusCard({ status }: { status: StreamStatus }) {
  return (
    <div className="streamStatusCard">
      <h2>Stream Status</h2>

      {status.online ? (
        <>
          <p className="onlineText">LIVE NOW</p>
          <p>Uptime: {Math.floor(status.uptimeSeconds! / 60)} min</p>
          <p>Viewers: {status.viewerCount}</p>
          <p>Resolution: {status.resolution}</p>
          <p>Bitrate: {status.bitrateKbps} kbps</p>
          <p>FPS: {status.fps}</p>
        </>
      ) : (
        <>
          <p className="offlineText">Offline</p>
          {status.lastDisconnected && (
            <p>Last ended: {new Date(status.lastDisconnected).toLocaleString()}</p>
          )}
          {status.error && <p>Error: {status.error}</p>}
        </>
      )}
    </div>
  );
}