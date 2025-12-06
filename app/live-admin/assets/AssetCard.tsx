'use client';

import type { AssetMeta } from './assets-types';

export default function AssetCard({ asset }: { asset: AssetMeta }) {
  return (
    <div className="assetCard">
      {asset.type === 'image' ? (
        <img src={asset.url} alt={asset.name} className="assetThumb" />
      ) : (
        <div className="assetPlaceholder">
          {asset.type.toUpperCase()}
        </div>
      )}

      <p className="assetName">{asset.name}</p>
    </div>
  );
}