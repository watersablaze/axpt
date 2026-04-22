// app/admin/AdminNav.tsx

import Link from "next/link"

export default function AdminNav({ current }: { current?: string }) {

  const base = "px-3 py-1.5 rounded-lg border text-sm"
  const idle = "border-neutral-800 hover:border-cyan-500/60"
  const active = "border-cyan-500/70 bg-cyan-500/10"

  function cls(key: string) {
    return `${base} ${current === key ? active : idle}`
  }

  return (
    <nav className="flex items-center gap-2">
      <Link href="/admin/command-center" className={cls("command")}>
        Command
      </Link>

      <Link href="/admin/treasury" className={cls("treasury")}>
        Treasury
      </Link>

      <Link href="/admin/initiatives" className={cls("initiatives")}>
        Initiatives
      </Link>

      <Link href="/admin/settings" className={cls("settings")}>
        Settings
      </Link>
    </nav>
  )
}
