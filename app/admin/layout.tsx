import { cookies } from 'next/headers'
import { SESSION_COOKIE_NAME } from "@/shared/constants/cookies"
import AdminShell from '@/components/admin/layout/AdminLayout'
import { EntityProvider } from '@/lib/context/EntityContext'
import { OperatorProvider } from '@/lib/operator/OperatorContext'
import { prisma } from '@/infrastructure/db/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!session) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Unauthorized</h1>
        <p>No active admin session was found.</p>
      </main>
    )
  }

  const user = await prisma.user.findFirst({
    where: {
      accessToken: session,
    },
    select: {
      id: true,
      isAdmin: true,
    },
  })

  if (!user?.isAdmin) {
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