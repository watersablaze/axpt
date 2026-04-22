'use client'

import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import CommandPalette from './CommandPalette'

export default function AppShell({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>

      <CommandPalette />
    </div>
  )
}
