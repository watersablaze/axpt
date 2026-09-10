import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import CommandPalette from '@/components/system/CommandPalette'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-black text-white">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader />
        <main className="flex-1 overflow-auto bg-neutral-950 px-6 py-6">
          {children}
        </main>
        <CommandPalette />
      </div>
    </div>
  )
}
