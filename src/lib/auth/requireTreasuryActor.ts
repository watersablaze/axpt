import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getDevUser } from "@/lib/auth/devBypass"

const TREASURY_ALLOWED_EMAILS = [
  "connect@axpt.io",
  "chief.financial@axpt.io",
  "chief.strategy@axpt.io",
]

export async function requireTreasuryActor() {
  if (process.env.NODE_ENV !== "production") {
    const devUser = getDevUser()
    return devUser.email
  }

  const jar = await cookies()
  const email = jar.get("dev_actor_email")?.value || null

  if (!email) {
    redirect("/login")
  }

  if (!TREASURY_ALLOWED_EMAILS.includes(email)) {
    redirect("/admin")
  }

  return email
}
