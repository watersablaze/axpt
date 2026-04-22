'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEntity } from '@/lib/context/EntityContext'
import { ADMIN_NAV } from './AdminNavConfig'

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { setEntity } = useEntity()

  return (
    <aside className="hidden h-full w-[240px] flex-col border-r border-neutral-800 bg-black lg:flex">
      <div className="border-b border-neutral-800 p-4">
        <div className="text-lg font-semibold text-white">AXPT</div>
        <div className="text-xs text-neutral-500">Admin System</div>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {ADMIN_NAV.map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)

          return (
            <button
              key={item.href}
              onClick={() => {
                setEntity((prev) => ({
                  ...prev,
                  assets: [...item.entity.assets],
                }))
                router.push(item.href)
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition
                ${active
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-400 hover:bg-neutral-950 hover:text-white'
                }
              `}
            >
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
