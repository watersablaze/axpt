export default function TemporalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-black text-white min-h-screen p-6">
      {children}
    </div>
  )
}