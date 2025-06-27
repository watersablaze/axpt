'use client';

import React from 'react';

export default function SigilPortalIcon() {
  return (
    <div className="flex justify-center items-center mb-6">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-800 to-indigo-900 shadow-lg animate-pulse relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white text-2xl font-bold tracking-wide">
            AXPT
          </span>
        </div>
      </div>
    </div>
  );
}