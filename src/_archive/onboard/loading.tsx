'use client';

import OrbAnimation from '@/components/shared/OrbAnimation';

export default function Loading() {
  return (
    <div className="relative flex flex-col items-center justify-center h-screen w-screen bg-black text-white overflow-hidden">

      {/* 🌑 Sigil Background */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-10">
        <img
          src="/images/axpt-sigil-main.png"
          alt="AXPT Sigil"
          className="w-[520px] h-[520px] animate-pulse-slow"
          style={{
            filter: 'drop-shadow(0 0 30px rgba(255, 255, 255, 0.2))',
            transform: 'scale(1.05)',
          }}
        />
      </div>

      {/* 🧿 Orb + Message */}
      <div className="z-10 backdrop-blur-md">
        <OrbAnimation className="w-[160px] h-[160px] opacity-90" />
        <p className="text-purple-300 text-sm mt-6 animate-pulse">Stabilizing portal...</p>
      </div>
    </div>
  );
}