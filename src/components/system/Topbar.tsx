'use client'

import { usePathname } from 'next/navigation'
import { useEntity } from '@/lib/context/EntityContext'

const LABELS: Array<{ match: string; label: string }> = [
  { match: '/admin/treasury', label: 'Treasury' },
  { match: '/admin/command-center', label: 'Command Center' },
  { match: '/admin/settings', label: 'Settings' },
]

function getSurfaceLabel(pathname: string) {
  const match = LABELS.find((item) => pathname === item.match || pathname.startsWith(`${item.match}/`))
  return match?.label ?? 'Admin'
}

export default function Topbar() {
  const pathname = usePathname()
  const label = getSurfaceLabel(pathname)
  const environment = process.env.NODE_ENV === 'development' ? 'Development' : 'Production'
  const { entity, setEntity } = useEntity()
  const contextLabel = entity.assets[0] ? ` / ${entity.assets[0]}` : ''

  return (
    <div className="flex h-14 items-center border-b border-neutral-900 px-6">
      <div className="text-sm text-neutral-400">
        AXPT / {label}
        {contextLabel}
      </div>

      <div className="ml-auto flex items-center gap-4">
        {entity.assets.length > 0 || entity.wallets.length > 0 || entity.cases.length > 0 ? (
          <button
            onClick={() =>
              setEntity({
                assets: [],
                wallets: [],
                cases: [],
              })
            }
            className="text-xs text-neutral-500 transition-colors hover:text-white"
          >
            Clear Context
          </button>
        ) : null}

        <div className="text-xs text-neutral-500">{environment}</div>
      </div>
    </div>
  )
}
