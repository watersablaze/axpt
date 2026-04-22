import { OperatorProvider } from '@/lib/operator/OperatorContext'
import { EntityProvider } from '@/lib/context/EntityContext'
import AuthDebugPanel from '@/components/admin/debug/AuthDebugPanel'
import AdminShell from '@/components/admin/layout/AdminLayout'

import { requirePermission } from '@/domains/auth/requirePermission'
import { PERMISSIONS } from '@/domains/auth/permissions'

export default async function AdminAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requirePermission(PERMISSIONS.ADMIN_ACCESS)

  return (
    <OperatorProvider>
      <EntityProvider>
        <AdminShell>
          {children}
          {false && process.env.NODE_ENV === 'development' && <AuthDebugPanel />}
        </AdminShell>
      </EntityProvider>
    </OperatorProvider>
  )
}