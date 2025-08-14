'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from '@/styles/Upgrade.module.css';

const tierOptions = ['Investor', 'Farmer', 'Nomad', 'Merchant'] as const;
type Tier = typeof tierOptions[number];

export default function InvestorUpgradePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [tier, setTier] = useState<Tier>('Nomad');
  const [autoDetectedTier, setAutoDetectedTier] = useState<Tier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTier = async () => {
      try {
        const res = await fetch('/api/account/session');
        const data = await res.json();
        const tierFromSession = data?.session?.tier;
        if (tierFromSession && tierOptions.includes(tierFromSession)) {
          setTier(tierFromSession);
          setAutoDetectedTier(tierFromSession);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTier();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    return; // Placeholder while portal is closed
  };

  return (
    <div className={`${styles.pageFadeIn} relative min-h-screen flex items-center justify-center px-6 py-12 bg-black overflow-hidden`}>
      <div className={styles.portalGlowBackground} />

      <div className="relative z-10 w-full max-w-6xl flex flex-col md:flex-row items-start justify-between gap-8">
        {/* LEFT SECTION */}
        <div className="w-full md:w-[48%] mt-60">
          <div className={`flex justify-center mb-6 ${styles.sigilFadePulse}`}>
            <Image
              src="/images/axpt-sigil-main.png"
              alt="AXPT Sigil"
              width={380}
              height={380}
              className="rounded-full"
            />
          </div>
          <div className="bg-purple-900 bg-opacity-30 text-purple-100 border border-purple-700 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-2 flex items-center">
              <span className="mr-2">🔒</span> Account Creation Coming Soon
            </h2>
            <p className="text-sm text-purple-200">
              The gateway is not yet open, but you’re right where you need to be. Soon you’ll grow from Token-Bearer to Key-Holder as a full AXPT.io account holder and engage the ecosystem.
            </p>
            <p className="text-xs text-purple-400 mt-2">
              Check back soon for activation.
            </p>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="w-full md:w-[48%] opacity-50 pointer-events-none">
          <div className={`${styles.formCard} w-full p-8 rounded-xl border border-purple-900 shadow-2xl bg-black bg-opacity-80 text-white`}>
            <div className="text-center mb-6">
              <h1 className="text-3xl font-semibold mb-1">🔐 Portal Gate</h1>
              <p className="text-sm text-purple-200">
                Create an AXPT.io account and access your wallet and deeper portals for Earth-Centered investment opportunities.
              </p>
              <p className="text-xs text-purple-400 mt-1">Please fill out the form below.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm text-gray-300 mb-1">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  className={`${styles.inputField} w-full px-4 py-2 rounded-md bg-gray-900 text-white border border-gray-700`}
                  disabled
                />
              </div>

              <div>
                <label htmlFor="pin" className="block text-sm text-gray-300 mb-1">Set Your Access PIN</label>
                <input
                  id="pin"
                  type="password"
                  value={pin}
                  className={`${styles.inputField} w-full px-4 py-2 font-bold text-lg rounded-md bg-gray-900 text-white border border-purple-700`}
                  disabled
                />
              </div>

              <div>
                <label htmlFor="confirmPin" className="block text-sm text-gray-300 mb-1">Confirm Access PIN</label>
                <input
                  id="confirmPin"
                  type="password"
                  value={confirmPin}
                  className={`${styles.inputField} w-full px-4 py-2 font-semibold text-lg rounded-md bg-gray-900 text-white border border-purple-700`}
                  disabled
                />
              </div>

              <div>
                <label htmlFor="tier" className="block text-sm text-gray-300 mb-1">Select Your Tier</label>
                <select
                  id="tier"
                  value={tier}
                  className="w-full px-4 py-2 rounded-md bg-gray-900 text-white border border-purple-600"
                  disabled
                >
                  {tierOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {autoDetectedTier && (
                  <p className="text-xs text-green-400 mt-1">Auto-detected: {autoDetectedTier}</p>
                )}
              </div>

              <button
                type="submit"
                disabled
                className="w-full px-6 py-3 rounded-md bg-gray-800 text-white font-semibold opacity-50 cursor-not-allowed"
              >
                🚫 Upgrade Portal Temporarily Closed
              </button>
            </form>

            <p className="text-xs text-gray-500 mt-6 text-center">
              The Axis Point
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}