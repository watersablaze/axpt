'use client';

export default function ProtectedLayoutClient({
  children,
}: {
  user?: any
  children: React.ReactNode
}) {
  // 🔥 FULL BYPASS
  const user = {
    name: "Dev Operator",
    email: "connect@axpt.io",
    tier: "TREASURY"
  }

  return (
    <div className="p-4">
      <div className="text-sm text-right text-gray-600">
        Welcome, <strong>{user.name}</strong>
      </div>
      {children}
    </div>
  )
}