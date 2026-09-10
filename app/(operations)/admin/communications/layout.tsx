import { redirect } from "next/navigation"

import OperationsShell from "@/components/admin/layout/OperationsShell"

import { EntityProvider } from "@/lib/context/EntityContext"
import { OperatorProvider } from "@/lib/operator/OperatorContext"

import { getPrincipal } from "@/domains/auth/getPrincipal"
import { authorityKernel } from "@/domains/auth/AuthorityKernel"
import { PERMISSIONS } from "@/domains/auth/permissions"

import { CommunicationsProvider } from "@/lib/realtime/communications/CommunicationsProvider"

export const dynamic =
  "force-dynamic"

export default async function CommunicationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const principal =
    await getPrincipal()

  if (!principal) {
    redirect(
      "/login?next=/admin/communications"
    )
  }

  /*
   * Admission to the shared institutional shell.
   *
   * This is intentionally distinct from
   * platform-administrator authority.
   */
  authorityKernel.require(
    principal,
    PERMISSIONS.ADMIN_SURFACE_ACCESS
  )

  /*
   * Authority to use Communications remains
   * independently governed by the domain.
   */
  authorityKernel.require(
    principal,
    PERMISSIONS.COMMUNICATIONS_ACCESS
  )

  return (
    <OperatorProvider>
      <EntityProvider>
        <OperationsShell
          permissions={principal.permissions}
        >
          <CommunicationsProvider>
            {children}
          </CommunicationsProvider>
        </OperationsShell>
      </EntityProvider>
    </OperatorProvider>
  )
}
