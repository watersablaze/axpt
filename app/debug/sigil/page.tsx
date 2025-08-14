'use client';

import SigilWatermark from '@/components/SigilWatermark';

export default function SigilDebugPage() {
  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center">
      <SigilWatermark />
    </div>
  );
}