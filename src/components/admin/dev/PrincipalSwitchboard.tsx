'use client'

import { useEffect, useState } from 'react'

type PrincipalDebug = {
  userId?: string
  email?: string
  roles?: string[]
  permissions?: string[]
  exp?: number
}

const BOOTSTRAPS = [
  {
    label: 'Bootstrap Admin',
    endpoint: '/api/dev/auth/bootstrap-admin',
  },
  {
    label: 'Bootstrap Resident 1',
    endpoint: '/api/dev/auth/bootstrap-resident',
  },
  {
    label: 'Bootstrap Resident 2',
    endpoint: '/api/dev/auth/bootstrap-resident2',
  },
]

export default function PrincipalSwitchboard() {
  const [principal, setPrincipal] = useState<PrincipalDebug | null>(null)
  const [loading, setLoading] = useState(false)

    async function loadPrincipal() {
    try {
        const res = await fetch('/api/admin/auth/debug')
        const json = await res.json()

        if (!json.ok) {
        throw new Error(json.error ?? 'Failed to load principal')
        }

        setPrincipal({
        ...json.data.principal,
        exp: json.data.sessionPayload?.exp,
        })
    } catch {
        setPrincipal(null)
    }
    }

  async function bootstrap(endpoint: string) {
    setLoading(true)

    try {
      await fetch(endpoint, { method: 'POST' })
      await loadPrincipal()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPrincipal()
  }, [])

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
        <h2 className="text-lg font-medium mb-4">Bootstrap Principal</h2>

        <div className="flex flex-wrap gap-3">
          {BOOTSTRAPS.map((item) => (
            <button
              key={item.endpoint}
              onClick={() => bootstrap(item.endpoint)}
              disabled={loading}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-800 transition"
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
        <h2 className="text-lg font-medium mb-4">Current Principal</h2>

        {!principal ? (
          <p className="text-sm text-neutral-500">No principal resolved.</p>
        ) : (
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-neutral-400">Email:</span>{' '}
              {principal.email ?? '—'}
            </div>

            <div>
              <span className="text-neutral-400">Roles:</span>{' '}
              {principal.roles?.join(', ') ?? '—'}
            </div>

            <div>
              <span className="text-neutral-400">Permissions:</span>{' '}
              {principal.permissions?.length ?? 0}
            </div>

            <div>
              <span className="text-neutral-400">Expires:</span>{' '}
              {principal.exp
                ? new Date(principal.exp * 1000).toLocaleString()
                : '—'}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
        <h2 className="text-lg font-medium mb-4">Quick Links</h2>

        <div className="flex flex-wrap gap-3 text-sm">
          <a href="/admin" className="underline">
            Admin
          </a>
          <a href="/portal" className="underline">
            Portal
          </a>
          <a href="/api/admin/auth/debug" className="underline">
            Principal Debug JSON
          </a>
        </div>
      </section>
    </div>
  )
}