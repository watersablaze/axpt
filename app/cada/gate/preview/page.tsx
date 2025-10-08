'use client';

import CadaClientPage from '../../CadaClientPage';

export default function CadaGatePreviewPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full px-4 sm:px-6 py-12">
        {/* 🌀 Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#E6C667] tracking-wide">
            CADA Gate Preview
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            This preview displays the live client interface for the CADA Waitlist.
          </p>
        </header>

        {/* 🪞 Embedded CADA Client Page */}
        <section className="relative rounded-2xl border border-[#E6C667]/30 bg-black/40 backdrop-blur-lg p-4 sm:p-6 shadow-[0_0_20px_rgba(230,198,103,0.15)] hover:shadow-[0_0_30px_rgba(230,198,103,0.25)] transition-shadow duration-700">
          <CadaClientPage />
        </section>

        {/* 📜 Footer */}
        <footer className="text-center mt-12 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} CADA — Cultural African Diaspora Art</p>
        </footer>
      </div>
    </main>
  );
}