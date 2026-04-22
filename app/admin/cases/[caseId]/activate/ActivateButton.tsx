"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export default function ActivateButton({ caseId }: { caseId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleActivate() {
    setLoading(true)

    const res = await fetch(`/api/axpt/cases/${caseId}/activate`, {
      method: "POST",
    })

    if (res.ok) {
      // 🔥 THIS IS WHAT YOU WERE MISSING
      router.push(`/admin/cases/${caseId}`)
      router.refresh()
    } else {
      alert("Activation failed")
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleActivate}
      disabled={loading}
      className="w-full rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 transition px-4 py-2 font-semibold"
    >
      {loading ? "Activating..." : "Confirm & Activate Case"}
    </button>
  )
}