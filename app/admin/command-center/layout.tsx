import { AwarenessProvider } from "@/lib/realtime/AwarenessProvider"

export default function CommandCenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AwarenessProvider>
      <div className="min-h-screen">
        {children}
      </div>
    </AwarenessProvider>
  )
}
