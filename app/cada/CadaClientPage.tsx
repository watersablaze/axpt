'use client';
import { useEffect, useState } from 'react';
import CadaWaitlistForm from '@/components/cada/CadaWaitlistForm';

export default function CadaClientPage() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 300);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-start overflow-hidden">
    {/* 🔮 Hero Section (Refined, Ambient Version) */}
    <section
    className={`relative w-full h-[60vh] md:h-[65vh] flex flex-col items-center justify-center text-center transition-opacity duration-[2000ms] ease-out ${
        loaded ? 'opacity-100' : 'opacity-0'
    }`}
    style={{
        backgroundImage: 'url(/images/heros/cada-hero.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    }}
    >
    {/* Occlusion Lighting */}
    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black/95 mix-blend-overlay" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04)_0%,transparent_80%)]" />
    <div className="absolute inset-0 backdrop-brightness-[1.2] saturate-[1.15]" />

    {/* Ambient Motion Light (hover shimmer) */}
    <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,214,137,0.1)_0%,rgba(255,255,255,0)_25%,rgba(255,214,137,0.1)_50%,rgba(255,255,255,0)_75%,rgba(255,214,137,0.1)_100%)] animate-[rotate_40s_linear_infinite] mix-blend-soft-light opacity-40" />

    {/* Palm shimmer motion */}
    <div
        className={`absolute right-0 bottom-0 w-[70vw] sm:w-[50vw] h-[50vh] sm:h-[60vh] bg-[url('/images/heros/cada-hero.jpg')] bg-cover bg-right opacity-[0.08] blur-[2px] transition-transform duration-[3000ms] ${
        loaded ? 'translate-x-0' : 'translate-x-10'
        }`}
        style={{ mixBlendMode: 'soft-light' }}
    />
    </section>

      {/* 🌍 Waitlist Section */}
      <section
        className={`relative z-10 w-full max-w-md md:max-w-lg px-4 sm:px-6 py-10 sm:py-12 -mt-12 sm:-mt-16 transition-all duration-[1800ms] ease-out ${
          loaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
      >
        <div className="backdrop-blur-lg bg-black/60 border border-[#E6C667]/30 rounded-2xl shadow-[0_0_25px_rgba(230,198,103,0.15)] p-6 sm:p-8 hover:shadow-[0_0_35px_rgba(230,198,103,0.25)] transition-shadow duration-700">
          <h2 className="text-xl sm:text-2xl font-semibold text-center mb-5 sm:mb-6 text-[#E6C667]">
            Join the Waitlist
          </h2>
          <p className="text-center text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base">
            Be among the first to receive your invitation for Miami Art Basel 2025.
          </p>
          <CadaWaitlistForm />
        </div>
      </section>
    </main>
  );
}