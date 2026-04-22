'use client'

import { usePathname } from 'next/navigation'
import { getAdminPageMeta } from './AdminNavConfig'

export default function AdminHeader() {
  const pathname = usePathname()
  const meta = getAdminPageMeta(pathname)

  return (
    <header className="border-b border-neutral-800 bg-black/80 px-6 py-4 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Admin
          </div>
          <h1 className="text-xl font-semibold text-white">{meta.title}</h1>
          {meta.subtitle ? (
            <p className="text-sm text-neutral-400">{meta.subtitle}</p>
          ) : null}
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-400">
          Command Palette
          <span className="ml-2 rounded border border-neutral-700 px-1.5 py-0.5 text-[11px] text-neutral-300">
            Ctrl/Cmd + K
          </span>
        </div>
      </div>
    </header>
  )
}
