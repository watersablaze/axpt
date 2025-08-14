export default function InvestorLayout({ children }: { children: React.ReactNode }) {
  console.log('🌀 InvestorLayout rendered');

  return (
    <html lang="en">
      <body className="h-screen w-screen overflow-hidden bg-black text-white">
        {/* 🌌 Radial Background */}
        <div className="absolute inset-0 z-0 axptRadialBackground" />

        {/* 🔄 Dashboard Wrapper */}
        <div className="relative z-10 h-full w-full">
          {children}
        </div>
      </body>
    </html>
  );
}