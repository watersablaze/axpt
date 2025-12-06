'use client';

import AssetCard from './AssetCard';
import type { AssetMeta } from './assets-types';

export default function AssetGrid({ assets }: { assets: AssetMeta[] }) {
  return (
    <div className="assetGrid">
      {assets.map((a) => (
        <AssetCard key={a.id} asset={a} />
      ))}
    </div>
  );
}