// app/layout.tsx
import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import NeonWake from '@/components/NeonWake'

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
        {children}
        <Toaster richColors position="top-right" />
        <div id="portal-root" />
      </body>
    </html>
  );
}