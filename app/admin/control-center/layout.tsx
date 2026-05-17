export default function ControlCenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section style={{ minHeight: '100%', width: '100%' }}>
      {children}
    </section>
  )
}