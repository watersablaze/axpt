import '@/styles/globals.css'

import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import Script from 'next/script'

import AuraDiagnostics from '@/components/devtools/AuraDiagnostics'
import { LayerProvider } from '@/lib/context/LayerContext'
import DeploymentBanner from '@/components/system/DeploymentBanner'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata = {
  title: 'AXPT.io Portal',
  description: 'Culturally awakened economies and regenerative systems.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <html lang="en">
      <body className={inter.className}>
        <LayerProvider>
          <div id="app-content">
            {children}
          </div>

          {isDev && <AuraDiagnostics />}
        </LayerProvider>

        <DeploymentBanner />
        <Toaster richColors position="top-right" />

        {/* Jitsi Script (correct placement) */}
        <Script
          src="https://meet.jit.si/external_api.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}