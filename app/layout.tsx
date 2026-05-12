import '@/styles/globals.css'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { Toaster } from 'sonner'

import AuraDiagnostics from '@/components/devtools/AuraDiagnostics'
import DeploymentBanner from '@/components/system/DeploymentBanner'
import { LayerProvider } from '@/lib/context/LayerContext'
import { OrganismStateProvider } from '@/ui/organism/OrganismStateProvider'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
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
        <OrganismStateProvider>
          <LayerProvider>
            <div id="app-content">{children}</div>

            {isDev ? <AuraDiagnostics /> : null}
          </LayerProvider>
        </OrganismStateProvider>

        <DeploymentBanner />

        <Toaster richColors position="top-right" />

        <Script
          src="https://meet.jit.si/external_api.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}