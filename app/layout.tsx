// app/layout.tsx
import '@/styles/globals.css';
import '@/styles/globals/variables.css';
import '@/styles/utilities.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import NeonWake from '@/components/NeonWake';
import NebulaOverlay from '@/components/background/NebulaOverlay';
import BloomControl from '@/components/dev/BloomControl';
import CeremonyControlPanel from '@/components/devtools/CeremonyControlPanel';
import AuraDebugPanel from '@/components/devtools/AuraDebugPanel';
import AuraInitializer from '@/components/devtools/AuraInitializer';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'AXPT.io Portal',
  description: 'Culturally awakened economies and regenerative systems.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} text-white bg-black`}>
        {/* 🌌 Background and ambient systems */}
        <NeonWake />
        <NebulaOverlay />
        <AuraInitializer />

        {/* 🜍 Foreground App Content */}
        {children}

        {/* 🧪 Developer Panels — only visible in development */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <CeremonyControlPanel />
            <BloomControl />
            <AuraDebugPanel />
          </>
        )}

        {/* 🍷 Notifications */}
        <Toaster richColors position="top-right" />

        {/* 🔮 Portal Mounts */}
        <div id="portal-root" />
      </body>
    </html>
  );
}