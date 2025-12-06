'use client';

import { useState } from 'react';

export default function AssetUploader({ onUpload }: { onUpload: Function }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    // TODO: replace with Supabase file upload
    const url = URL.createObjectURL(file);

    onUpload({
      id: crypto.randomUUID(),
      name: file.name,
      url,
      type: file.type.startsWith('image') ? 'image' : 'other',
      createdAt: new Date().toISOString(),
      size: file.size,
    });

    setUploading(false);
  };

  return (
    <div className="assetUploader">
      <label className="uploadBox">
        {uploading ? 'Uploading...' : 'Upload Asset'}
        <input type="file" hidden onChange={handleUpload} />
      </label>
    </div>
  );
}