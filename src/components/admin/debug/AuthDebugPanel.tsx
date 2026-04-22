'use client'

import { useEffect, useState } from 'react'

type AuthDebugState = {
  cookiePresent: boolean
  cookieName: string
  sessionValid: boolean
  sessionPayload: Record<string, unknown> | null
  principal: {
    userId: string
    email: string
    displayName: string | null
    roles: string[]
    permissions: string[]
    sessionId?: string | null
  } | null
  legacySignals: {
    devImpersonateCookiePresent: boolean
    treasuryActorCookiePresent: boolean
    councilCookiePresent: boolean
    sessionFallbackQueryEnabled: boolean
  }
  dbUser: {
    id: string
    email: string
    isAdmin: boolean
    tier: string | null
    hasCouncilElder: boolean
    activeUserRoles: string[]
  } | null
}

export default function AuthDebugPanel() {
  const [data, setData] = useState<AuthDebugState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const res = await fetch('/api/admin/auth/debug', {
          cache: 'no-store',
        })

        const json = await res.json()

        if (!res.ok || !json.ok) {
          if (active) setError(json.error ?? 'Failed to load auth debug')
          return
        }

        if (active) {
          setData(json.data)
          setError(null)
        }
      } catch (err: any) {
        if (active) {
          setError(err.message ?? 'Failed to load auth debug')
        }
      }
    }

    load()
    const id = window.setInterval(load, 5000)

    return () => {
      active = false
      window.clearInterval(id)
    }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-[420px] rounded-xl border border-neutral-700 bg-black/95 shadow-2xl">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-medium text-white">Auth Debug</span>
        <span className="text-xs text-neutral-400">
          {open ? 'Hide' : 'Show'}
        </span>
      </button>

      {open && (
        <div className="border-t border-neutral-800 px-4 py-3 text-xs">
          {error && <div className="mb-3 text-red-400">{error}</div>}

          {!error && !data && (
            <div className="text-neutral-400">Loading auth state...</div>
          )}

          {data && (
            <div className="space-y-4">
              <section>
                <div className="mb-1 text-neutral-400">Session</div>
                <div className="text-neutral-200">
                  Cookie present: {data.cookiePresent ? 'Yes' : 'No'}
                </div>
                <div className="text-neutral-200">
                  Cookie name: {data.cookieName}
                </div>
                <div className="text-neutral-200">
                  Session valid: {data.sessionValid ? 'Yes' : 'No'}
                </div>
              </section>

              <section>
                <div className="mb-1 text-neutral-400">Principal</div>
                {data.principal ? (
                  <div className="space-y-1 text-neutral-200">
                    <div>Email: {data.principal.email}</div>
                    <div>User ID: {data.principal.userId}</div>
                    <div>
                      Roles:{' '}
                      {data.principal.roles.length
                        ? data.principal.roles.join(', ')
                        : 'None'}
                    </div>
                    <div>
                      Permissions:{' '}
                      {data.principal.permissions.length
                        ? data.principal.permissions.join(', ')
                        : 'None'}
                    </div>
                  </div>
                ) : (
                  <div className="text-yellow-400">No principal resolved</div>
                )}
              </section>

              <section>
                <div className="mb-1 text-neutral-400">DB User</div>
                {data.dbUser ? (
                  <div className="space-y-1 text-neutral-200">
                    <div>Email: {data.dbUser.email}</div>
                    <div>isAdmin: {data.dbUser.isAdmin ? 'true' : 'false'}</div>
                    <div>tier: {data.dbUser.tier ?? '—'}</div>
                    <div>
                      Council Elder:{' '}
                      {data.dbUser.hasCouncilElder ? 'true' : 'false'}
                    </div>
                    <div>
                      UserRoles:{' '}
                      {data.dbUser.activeUserRoles.length
                        ? data.dbUser.activeUserRoles.join(', ')
                        : 'None'}
                    </div>
                  </div>
                ) : (
                  <div className="text-yellow-400">No DB user resolved</div>
                )}
              </section>

              <section>
                <div className="mb-1 text-neutral-400">Legacy Signals</div>
                <div className="space-y-1 text-neutral-200">
                  <div>
                    dev_impersonate_email:{' '}
                    {data.legacySignals.devImpersonateCookiePresent
                      ? 'present'
                      : 'absent'}
                  </div>
                  <div>
                    dev_actor_email:{' '}
                    {data.legacySignals.treasuryActorCookiePresent
                      ? 'present'
                      : 'absent'}
                  </div>
                  <div>
                    council cookie:{' '}
                    {data.legacySignals.councilCookiePresent
                      ? 'present'
                      : 'absent'}
                  </div>
                  <div>
                    session fallback query enabled:{' '}
                    {data.legacySignals.sessionFallbackQueryEnabled
                      ? 'yes'
                      : 'no'}
                  </div>
                </div>
              </section>

              <section>
                <div className="mb-1 text-neutral-400">Session Payload</div>
                <pre className="max-h-40 overflow-auto rounded bg-neutral-950 p-2 text-[10px] text-neutral-300">
                  {JSON.stringify(data.sessionPayload, null, 2)}
                </pre>
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  )
}