// app/layout.tsx
import '@/styles/globals.css';
import '@/styles/globals/variables.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import NeonWake from '@/components/NeonWake';
import NebulaOverlay from '@/components/background/NebulaOverlay';
import BloomControl from '@/components/dev/BloomControl';
import CeremonyControlPanel from '@/components/devtools/CeremonyControlPanel';
import AuraDebugPanel from '@/components/devtools/AuraDebugPanel';
import AuraInitializer from '@/components/devtools/AuraInitializer'; // ✅ safe client init wrapper

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'AXPT.io Portal',
  description: 'Culturally awakened economies and regenerative systems.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} text-white`}>
        {/* 🌌 Background and ambient systems */}
        <NeonWake />
        <NebulaOverlay />

        {/* ⚡ Initialize aura behavior on client only */}
        <AuraInitializer />

        {/* 🌍 Main site content */}
        {children}

        {/* 🧪 Developer panels visible only in dev mode */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <CeremonyControlPanel />
            <BloomControl />
            <AuraDebugPanel />
          </>
        )}

        {/* 🍷 Toast notifications */}
        <Toaster richColors position="top-right" />

        {/* Portal mount for modals, overlays, etc. */}
        <div id="portal-root" />
      </body>
    </html>
  );
}