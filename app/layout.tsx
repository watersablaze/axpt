// app/layout.tsx

import '@/styles/globals.css'

import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import Script from 'next/script'

import AuraDiagnostics from '@/components/devtools/AuraDiagnostics'
import NebulaOverlay from '@/components/background/NebulaOverlay'

import { LayerProvider } from '@/lib/context/LayerContext'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata = {
  title: 'AXPT.io Portal',
  description: 'Culturally awakened economies and regenerative systems.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <html lang="en">

      <head>
        <Script
          src="https://meet.jit.si/external_api.js"
          strategy="beforeInteractive"
        />
      </head>

      <body className={inter.className}>

      <div className="rails" />
      
        <LayerProvider>

          {/* atmospheric layer */}
          <NebulaOverlay />
          <div className="axisFieldBreath" />

          {/* main portal content */}
          <div id="app-content">
            {children}
          </div>

          {/* dev diagnostics */}
          {isDev && <AuraDiagnostics />}

        </LayerProvider>

        <Toaster richColors position="top-right" />

      </body>

    </html>
  )
}