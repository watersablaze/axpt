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
    <header className="min-w-0 border-b border-neutral-800 bg-black/80 px-3 py-3 backdrop-blur sm:px-6 sm:py-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1">
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Admin
          </div>
          <h1 className="text-lg font-semibold text-white sm:text-xl">{meta.title}</h1>
          {meta.subtitle ? (
            <p className="max-w-2xl text-sm leading-5 text-neutral-400">{meta.subtitle}</p>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
          <div className="hidden rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-400 sm:block">
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
