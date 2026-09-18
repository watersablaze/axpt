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
          className="min-h-0 flex-1 overflow-auto bg-neutral-950 px-6 py-6"
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
