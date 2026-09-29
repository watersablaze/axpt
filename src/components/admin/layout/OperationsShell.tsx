'use client'

import { usePathname } from 'next/navigation'
import OperationsSidebar from './OperationsSidebar'
import OperationsHeader from './OperationsHeader'
import CommandPalette from '@/components/system/CommandPalette'

export default function OperationsShell({
  children,
  permissions,
}: {
  children: React.ReactNode
  permissions: readonly string[]
}) {
  const pathname = usePathname()
  const controlCenterOwnsTopEdge =
    pathname === '/admin/control-center' ||
    pathname.startsWith('/admin/control-center/')

  return (
    <div
      className="flex overflow-hidden bg-black text-white"
      style={{
        height: "100dvh",
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <OperationsSidebar
        permissions={permissions}
      />
      <div
        className="flex min-h-0 min-w-0 flex-1 flex-col"
        style={{
          minHeight: 0,
          minWidth: 0,
          flex: "1 1 0%",
          overflow: "hidden",
        }}
      >
        <OperationsHeader />
        <main
          className={`min-h-0 min-w-0 flex-1 overflow-auto bg-neutral-950 px-3 pb-3 sm:px-6 sm:pb-6 ${
            controlCenterOwnsTopEdge
              ? 'pt-0 sm:pt-0'
              : 'pt-3 sm:pt-6'
          }`}
          style={{
            minHeight: 0,
            minWidth: 0,
            flex: "1 1 0%",
            overflow: "auto",
          }}
        >
          {children}
        </main>
        <CommandPalette
          permissions={permissions}
        />
      </div>
    </div>
  )
}
