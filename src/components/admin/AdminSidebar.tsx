"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  function isActive(path: string) {
    return pathname.startsWith(path)
  }

  function linkClass(path: string) {
    return isActive(path)
      ? "text-cyan-400"
      : "text-neutral-400 hover:text-cyan-400"
  }

  return (
    <aside
      className={`transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      } border-r border-neutral-800 p-4 bg-black`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="text-xs text-neutral-500 mb-6"
      >
        {collapsed ? "→" : "←"}
      </button>

      <div className="space-y-6 text-sm">
        <div>
          <div className="text-xs text-neutral-500 mb-2">COMMAND</div>

          <Link
            href="/admin/command-center"
            className={`block ${linkClass("/admin/command-center")}`}
          >
            {collapsed ? "C" : "Command Center"}
          </Link>
        </div>

        <div>
          <div className="text-xs text-neutral-500 mb-2">TREASURY</div>

          <Link
            href="/admin/treasury"
            className={`block ${linkClass("/admin/treasury")}`}
          >
            {collapsed ? "O" : "Overview"}
          </Link>

          <Link
            href="/admin/treasury#financial-state"
            className={`block ${linkClass("/admin/treasury")}`}
          >
            {collapsed ? "F" : "Financial State"}
          </Link>

          <Link
            href="/admin/treasury#mirror-pipeline"
            className={`block ${linkClass("/admin/treasury")}`}
          >
            {collapsed ? "M" : "Mirror Pipeline"}
          </Link>

          <Link
            href="/admin/treasury#verification"
            className={`block ${linkClass("/admin/treasury")}`}
          >
            {collapsed ? "V" : "Verification"}
          </Link>

          <Link
            href="/admin/treasury#sync"
            className={`block ${linkClass("/admin/treasury")}`}
          >
            {collapsed ? "S" : "Sync"}
          </Link>

          <Link
            href="/admin/treasury#control"
            className={`block ${linkClass("/admin/treasury")}`}
          >
            {collapsed ? "C" : "Control"}
          </Link>
        </div>

        <div>
          <div className="text-xs text-neutral-500 mb-2">OPERATIONS</div>

          <Link
            href="/admin/treasury/cases"
            className={`block ${linkClass("/admin/treasury/cases")}`}
          >
            {collapsed ? "C" : "Cases"}
          </Link>

          <Link
            href="/admin/treasury/escrow"
            className={`block ${linkClass("/admin/treasury/escrow")}`}
          >
            {collapsed ? "E" : "Escrow"}
          </Link>

          <Link
            href="/admin/treasury/artifacts"
            className={`block ${linkClass("/admin/treasury/artifacts")}`}
          >
            {collapsed ? "A" : "Artifacts"}
          </Link>
        </div>

        <div>
          <div className="text-xs text-neutral-500 mb-2">SETTINGS</div>

          <Link
            href="/admin/settings"
            className={`block ${linkClass("/admin/settings")}`}
          >
            {collapsed ? "S" : "Settings"}
          </Link>
        </div>

      </div>
    </aside>
  )
}
