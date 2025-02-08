'use client'; // Mark this as a client component

import React from 'react';
import { SessionProvider } from 'next-auth/react';

const SessionProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  return <SessionProvider>{children}</SessionProvider>;
};

export default SessionProviderWrapper;