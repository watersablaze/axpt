// app/layout.tsx
import '@/styles/globals.css';
import '@/styles/globals/variables.css';
import '@/styles/utilities.css';
import '@/styles/debug.css';

import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';

import Script from 'next/script';

import NeonWake from '@/components/NeonWake';
import NebulaOverlay from '@/components/background/NebulaOverlay';
import AuraInitializer from '@/components/devtools/AuraInitializer';

import { MirrorRayProvider } from '@/lib/context/MirrorRayContext';

// Unified Developer Oracle
import NommoDebugPanel from '@/components/debug/NommoDebugPanel';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'AXPT.io Portal',
  description: 'Culturally awakened economies and regenerative systems.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="en">
      <head>
        {/* 🔥 Required for embedding Jitsi in OBS without login */}
        <Script
          src="https://meet.jit.si/external_api.js"
          strategy="beforeInteractive"
        />
      </head>

      <body className={`${inter.className} text-white bg-black`}>
        {/* Energetic Layers */}
        <NeonWake />
        <NebulaOverlay />
        <AuraInitializer />

        {/* Nommo Engineering Console */}
        <MirrorRayProvider>
          {isDev && <NommoDebugPanel />}
          {children}
        </MirrorRayProvider>

        <Toaster richColors position="top-right" />
        <div id="portal-root" />
      </body>
    </html>
  );
}