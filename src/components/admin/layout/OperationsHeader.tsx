'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { getAdminPageMeta } from './OperationsNavConfig'

export default function OperationsHeader() {
  const pathname = usePathname()
  const meta = getAdminPageMeta(pathname)
  const [signingOut, setSigningOut] = useState(false)
  const [signOutFailed, setSignOutFailed] = useState(false)

  async function handleSignOut() {
    if (signingOut) {
      return
    }

    setSigningOut(true)
    setSignOutFailed(false)

    try {
      const response = await fetch('/api/auth/clear-session', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        setSignOutFailed(true)
        setSigningOut(false)
        return
      }

      window.location.assign('/login')
    } catch {
      setSignOutFailed(true)
      setSigningOut(false)
    }
  }

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

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-400">
            Command Palette
            <span className="ml-2 rounded border border-neutral-700 px-1.5 py-0.5 text-[11px] text-neutral-300">
              Ctrl/Cmd + K
            </span>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs font-medium text-neutral-300 transition hover:border-neutral-500 hover:text-white disabled:cursor-wait disabled:opacity-50"
          >
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>

          {signOutFailed ? (
            <span
              role="status"
              className="text-xs text-red-300"
            >
              Sign out failed
            </span>
          ) : null}
        </div>
      </div>
    </header>
  )
}
