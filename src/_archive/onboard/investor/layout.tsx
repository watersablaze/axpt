// Server component (default)
export default function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-screen overflow-hidden bg-black text-white">
      {/* 🌌 Radial Background */}
      <div className="absolute inset-0 z-0 axptRadialBackground" />

      {/* Page content */}
      <main className="relative z-10">{children}</main>
    </div>
  );
}