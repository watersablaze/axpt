'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = {
  name: string
  href: string
  match?: string
}

type NavSection = {
  label: string
  items: NavItem[]
}

const NAV: NavSection[] = [
  {
    label: 'COMMAND',
    items: [{ name: 'Command Center', href: '/admin/command-center', match: '/admin/command-center' }],
  },
  {
    label: 'TREASURY',
    items: [
      { name: 'Overview', href: '/admin/treasury', match: '/admin/treasury' },
      { name: 'Financial State', href: '/admin/treasury#financial-state', match: '/admin/treasury' },
      { name: 'Mirror Pipeline', href: '/admin/treasury#mirror-pipeline', match: '/admin/treasury' },
      { name: 'Verification', href: '/admin/treasury#verification', match: '/admin/treasury' },
      { name: 'Sync', href: '/admin/treasury#sync', match: '/admin/treasury' },
      { name: 'Control', href: '/admin/treasury#control', match: '/admin/treasury' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { name: 'Cases', href: '/admin/treasury/cases', match: '/admin/treasury/cases' },
      { name: 'Escrow', href: '/admin/treasury/escrow', match: '/admin/treasury/escrow' },
      { name: 'Artifacts', href: '/admin/treasury/artifacts', match: '/admin/treasury/artifacts' },
    ],
  },
  {
    label: 'SETTINGS',
    items: [{ name: 'Settings', href: '/admin/settings', match: '/admin/settings' }],
  },
]

function isActive(pathname: string, item: NavItem) {
  const match = item.match ?? item.href
  return pathname === match || pathname.startsWith(`${match}/`)
}

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 shrink-0 border-r border-neutral-900 bg-black p-4">
      <div className="mb-6 text-xs uppercase tracking-[0.24em] text-neutral-600">
        AXPT Ops
      </div>

      <div className="space-y-6 text-sm">
        {NAV.map((section) => (
          <div key={section.label}>
            <div className="mb-2 text-xs text-neutral-500">{section.label}</div>

            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(pathname, item)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded px-2 py-1.5 transition-colors ${
                      active
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
