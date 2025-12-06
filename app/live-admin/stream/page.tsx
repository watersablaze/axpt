'use client';

import StreamStatusCard from './StreamStatusCard';
import StreamKeyPanel from './StreamKeyPanel';
import StreamControls from './StreamControls';
import LiveThumbnail from './LiveThumbnail';

import { useLiveStatus } from '@/lib/live/useLiveStatus';

export default function StreamPage() {
  const live = useLiveStatus();

  return (
    <div className="streamPage">
      <h1>Stream Control Center</h1>

      <div className="gridMain">
        <StreamStatusCard status={live} />
        <LiveThumbnail src="/api/owncast/thumbnail" />
      </div>

      <div className="gridDetails">
        <StreamKeyPanel />
        <StreamControls />
      </div>
    </div>
  );
}