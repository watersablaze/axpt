// app/src/components/layouts/ProtectedLayoutClient.tsx
'use client';

import React from 'react';
import TierBadge from '@/components/shared/TierBadge';

type Props = {
  user: {
    name?: string | null;
    email: string;
    tier?: string | null;
  };
  children: React.ReactNode;
};

export default function ProtectedLayoutClient({ user, children }: Props) {
  return (
    <div className="p-4">
      <div className="text-sm text-right text-gray-600">
        Welcome, <strong>{user.name || user.email}</strong>{' '}
        {user.tier && <TierBadge tier={user.tier} className="ml-2" />}
      </div>
      {children}
    </div>
  );
}