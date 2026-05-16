import { redirect } from "next/navigation"

import { getPrincipal } from "@/domains/auth/getPrincipal"

const TREASURY_ALLOWED_ROLES = [
  "ADMIN",
  "TREASURY",
  "OPERATOR",
]

export async function requireTreasuryActor() {
  const principal = await getPrincipal()

  if (!principal) {
    redirect("/login")
  }

  const allowed = principal.roles.some((role) =>
    TREASURY_ALLOWED_ROLES.includes(role)
  )

  if (!allowed) {
    redirect("/admin")
  }

  return principal.email
}