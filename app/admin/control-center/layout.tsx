import Link from "next/link"

export default function ControlCenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* SIDEBAR */}
      <aside
        style={{
          width: "240px",
          padding: "16px",
          borderRight: "1px solid #222",
        }}
      >
        <h3 style={{ marginBottom: "12px" }}>Control Center</h3>

        <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Link href="/admin/control-center">Overview</Link>
          <Link href="/admin/control-center/execution">Execution</Link>
          <Link href="/admin/control-center/treasury">Treasury</Link>
          <Link href="/admin/control-center/system">System</Link>
          <Link href="/admin/control-center/spine">Spine</Link>
        </nav>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, padding: "20px" }}>
        {children}
      </main>
    </div>
  )
}