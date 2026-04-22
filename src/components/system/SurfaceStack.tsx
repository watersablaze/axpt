'use client'

export default function SurfaceStack({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="surfaceStack">
      {children}
    </div>
  )
}
