import { getPrincipal } from "@/domains/auth/getPrincipal"
import { PERMISSIONS } from "@/domains/auth/permissions"

import CommunicationsWorkspace from "@/components/admin/communications/CommunicationsWorkspace"

export const dynamic =
  "force-dynamic"

export default async function CommunicationsPage() {
  const principal =
    await getPrincipal()

  if (!principal) {
    /*
     * Authentication is enforced by the
     * parent Communications layout.
     */
    return null
  }

  return (
    <CommunicationsWorkspace
      currentUserId={
        principal.userId
      }
      canManageConversations={
        principal.permissions.includes(
          PERMISSIONS.COMMUNICATIONS_CONVERSATION_MANAGE
        )
      }
      canCreateOperationalRooms={
        principal.permissions.includes(
          PERMISSIONS.COMMUNICATIONS_GROUP_CREATE
        )
      }
    />
  )
}
