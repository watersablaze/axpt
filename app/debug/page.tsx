'use client';

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-black relative text-white">
      <div className="fixed top-0 left-0 w-full text-center z-[9999]">
        Debug Active
      </div>

      {/* Force styles to render */}
      <div className="axptRadialBackground" />
      <img
        src="/images/axpt-sigil-main.png"
        alt="AXPT Sigil"
        className="axptSigil"
      />

      <div className="relative z-10 p-6">
        <h1 className="text-2xl font-bold">Debug Page</h1>
        <p>If you can see this, base layout works.</p>
      </div>

      {/* Keep classes from purging */}
      <span className="hidden axptRadialBackground axptSigil"></span>
    </div>
  );
}