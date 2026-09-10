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
  return (
    <div className="flex h-screen overflow-hidden bg-black text-white">
      <OperationsSidebar
        permissions={permissions}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <OperationsHeader />
        <main className="flex-1 overflow-auto bg-neutral-950 px-6 py-6">
          {children}
        </main>
        <CommandPalette
          permissions={permissions}
        />
      </div>
    </div>
  )
}
