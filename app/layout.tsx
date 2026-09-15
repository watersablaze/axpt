import '@/styles/globals.css'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'

import AuraDiagnostics from '@/components/devtools/AuraDiagnostics'
import DeploymentBanner from '@/components/system/DeploymentBanner'
import DocumentReadyGate from '@/components/system/DocumentReadyGate'
import { LayerProvider } from '@/lib/context/LayerContext'
import { OrganismStateProvider } from '@/ui/organism/OrganismStateProvider'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AXPT — Axis Point',
  description:
    'Coordination infrastructure for continuity, authority, trade, and institutional passage.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <html
        lang="en"
        style={{
          backgroundColor: '#10110f',
          color: 'rgba(245, 242, 235, 0.92)',
        }}
      >
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  if (
                    window.location.pathname === '/' &&
                    !window.location.hash
                  ) {
                    history.scrollRestoration = 'manual';

                    document.documentElement
                      .setAttribute(
                        'data-entry-normalizing',
                        'true'
                      );

                    document.documentElement.style
                      .scrollBehavior = 'auto';

                    window.scrollTo(0, 0);
                  }
                } catch {}
              `,
            }}
          />
        </head>

      <body className={inter.className}>
        <OrganismStateProvider>
          <LayerProvider>
            <div
                id="app-content"
                style={{
                  visibility: 'hidden',
                }}
              >
                <DocumentReadyGate />
                {children}
              </div>

            {isDev ? (
              <>
                <AuraDiagnostics />
                <DeploymentBanner />
              </>
            ) : null}
          </LayerProvider>
        </OrganismStateProvider>


        <Toaster richColors position="top-right" />

      </body>
    </html>
  )
}
