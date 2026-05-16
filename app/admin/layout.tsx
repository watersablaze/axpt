import AdminShell from '@/components/admin/layout/AdminLayout'
import { EntityProvider } from '@/lib/context/EntityContext'
import { OperatorProvider } from '@/lib/operator/OperatorContext'

import { getPrincipal } from '@/domains/auth/getPrincipal'

export const dynamic = 'force-dynamic'

export default async function AdminAppLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const principal = await getPrincipal()

  if (!principal) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Unauthorized</h1>
        <p>No active admin session was found.</p>
      </main>
    )
  }

  const isAdmin =
    principal.roles.includes('ADMIN') ||
    principal.roles.includes('ADMIN_PLATFORM') ||
    principal.permissions.includes('admin.access')

  if (!isAdmin) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Forbidden</h1>
        <p>This session does not have admin access.</p>
      </main>
    )
  }

  return (
    <OperatorProvider>
      <EntityProvider>
        <AdminShell>{children}</AdminShell>
      </EntityProvider>
    </OperatorProvider>
  )
}