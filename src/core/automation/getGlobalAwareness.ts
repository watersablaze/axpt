// src/core/automation/getGlobalAwareness.ts

export async function getGlobalAwareness() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/global-awareness`,
    { cache: "no-store" }
  )

  return res.json()
}