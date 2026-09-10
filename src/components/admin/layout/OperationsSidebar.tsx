'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEntity } from '@/lib/context/EntityContext'
import { getVisibleAdminNav } from './OperationsNavConfig'

export default function OperationsSidebar({
  permissions,
}: {
  permissions: readonly string[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { setEntity } = useEntity()

  const visibleNav =
    getVisibleAdminNav(permissions)

  return (
    <aside className="hidden h-full w-[240px] flex-col border-r border-neutral-800 bg-black lg:flex">
      <div className="border-b border-neutral-800 p-4">
        <div className="text-lg font-semibold text-white">AXPT</div>
        <div className="text-xs text-neutral-500">Admin System</div>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {visibleNav.map((item) => {
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
