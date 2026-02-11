// app/layout.tsx
import '@/styles/globals.css';
// import '@/styles/debug.css';

import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import Script from 'next/script';

import AuraDiagnostics from '@/components/devtools/AuraDiagnostics';
import NebulaOverlay from '@/components/background/NebulaOverlay';

// import { MirrorRayProvider } from '@/lib/context/MirrorRayContext';
// import NommoDebugPanel from '@/components/debug/NommoDebugPanel';

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

      <body className={inter.className}>
        {/* Global Atmosphere (single authority) */}
       <NebulaOverlay />
        {/* Developer Instrumentation (DEV ONLY) */}
        {isDev && <AuraDiagnostics />}

        {/* Application + Dev Console */}
        <>
        {children}
        </>

        <Toaster richColors position="top-right" />
        <div id="portal-root" />
      </body>
    </html>
  );
}