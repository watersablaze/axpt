'use client'

export default function SurfaceStack({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <main className="surfaceStack">
      {children}
    </main>
  )
}