'use client';

import { useState } from 'react';

export default function StreamKeyPanel() {
  const [visible, setVisible] = useState(false);

  const streamKey = process.env.NEXT_PUBLIC_OWNCAST_STREAM_KEY ?? '••••••••';

  return (
    <div className="streamKeyPanel">
      <h3>Stream Key</h3>

      <div className="keyRow">
        <span className="keyValue">
          {visible ? streamKey : '••••••••••••••••••••••'}
        </span>

        <button onClick={() => setVisible((v) => !v)}>
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}