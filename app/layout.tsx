// app/layout.tsx
import '@/styles/globals.css';
import '@/styles/globals/variables.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import NeonWake from '@/components/NeonWake';
import NebulaOverlay from '@/components/background/NebulaOverlay'; 
import BloomControl from '@/components/dev/BloomControl';
import CeremonyControlPanel from '@/components/devtools/CeremonyControlPanel';
import AuraDebugPanel from '@/components/devtools/AuraDebugPanel'; // ✅ added here
import { useEffect } from 'react';
import { initAuraDesync } from '@/lib/aura/desyncAura';

useEffect(() => {
  initAuraDesync();
}, []);

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
        <NeonWake />
        <NebulaOverlay /> {/* 🌀 Appears behind all content */}
        {children}

    {process.env.NODE_ENV === 'development' && <CeremonyControlPanel />}
    {process.env.NODE_ENV === 'development' && <BloomControl />}
    {process.env.NODE_ENV === 'development' && <AuraDebugPanel />}

        <Toaster richColors position="top-right" />
        <div id="portal-root" />
      </body>
    </html>
  );
}