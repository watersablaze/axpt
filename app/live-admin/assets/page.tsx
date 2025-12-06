'use client';

import { useState } from 'react';
import AssetUploader from './AssetUploader';
import AssetGrid from './AssetGrid';
import type { AssetMeta } from './assets-types';

export default function AssetsPage() {
  const [assets, setAssets] = useState<AssetMeta[]>([]);

  return (
    <div className="assetsPage">
      <h1>Assets</h1>

      <AssetUploader onUpload={(a: AssetMeta) => setAssets([a, ...assets])} />

      <AssetGrid assets={assets} />
    </div>
  );
}