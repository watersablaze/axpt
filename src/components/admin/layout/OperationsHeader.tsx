'use client'

import { useState } from 'react'
import Image from 'next/image'
import styles from './OperationsHeader.module.css'
import Link from 'next/link'
import AdminAttention from '../incoming/AdminAttention'
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
    <header className={styles.header}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(164,137,215,.35) 20%, rgba(113,183,203,.45) 48%, rgba(190,184,137,.3) 78%, transparent)' }} />

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-5 gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/admin" aria-label="AXPT Admin overview"
            className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200">
            <span className={styles.sigil}>
              <Image
                src="/sigil/v4/axpt_sigil_V4_transparent.png"
                alt=""
                width={68}
                height={68}
                className={styles.sigilImage}
              />
            </span>

          </Link>

          <span aria-hidden="true" className="h-6 w-px shrink-0 bg-neutral-700/70" />

          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[.2em] text-cyan-100/50">
              Administration
            </p>
            <p className="truncate text-xs font-normal leading-5 text-neutral-400">
              {pathname === '/admin' ? 'Operations overview' : meta.title}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <AdminAttention />

          <span
            title="Open Command Palette with Ctrl/Cmd + K"
            className="hidden items-center gap-2 border-l border-neutral-700/60 pl-3 text-[10px] text-neutral-500 xl:inline-flex"
          >
            Command
            <kbd className="rounded border border-neutral-700/70 px-1.5 py-1 font-mono text-[10px] text-neutral-400">
              ⌘ / Ctrl K
            </kbd>
          </span>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="min-h-9 rounded-md border border-neutral-700/70 px-3 text-[11px] font-medium text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200 disabled:cursor-wait disabled:opacity-50"
          >
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>

          {signOutFailed ? (
            <span role="status" className="text-xs text-red-300">
              Sign out failed
            </span>
          ) : null}
        </div>
      </div>
    </header>
  )
}
