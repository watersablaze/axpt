'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/Upgrade.module.css';
import SigilPortalIcon from '@/components/SigilPortalIcon';

const tierOptions = ['Investor', 'Farmer', 'Nomad', 'Merchant'] as const;
type Tier = typeof tierOptions[number];

export default function UpgradeAccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [tier, setTier] = useState<Tier>('Nomad');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [autoDetectedTier, setAutoDetectedTier] = useState<Tier | null>(null);

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
      } catch (err) {
        console.warn('Tier auto-detection failed.', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTier();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pin !== confirmPin) {
      setPinError('PINs do not match. Please re-enter.');
      return;
    } else {
      setPinError('');
    }

    setMessage('⏳ Upgrading your account...');

    try {
      const res = await fetch('/api/bridge-account/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin, tier }),
      });

      if (res.ok) {
        setMessage('✅ Upgrade successful. Redirecting...');
        const tierSlug = tier.toLowerCase();
        setTimeout(() => router.push(`/account/dashboard/${tierSlug}`), 1500);
      } else {
        const error = await res.text();
        setMessage(`❌ Upgrade failed: ${error}`);
      }
    } catch (err) {
      setMessage(`❌ Error: ${err}`);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-black overflow-hidden">
      {/* ✨ Portal Glow Aura */}
      <div className={styles.portalGlowBackground} />

      <div className={`${styles.formCard} relative z-10 w-full max-w-lg p-8 rounded-xl border border-purple-900 shadow-2xl bg-black bg-opacity-80 text-white`}>
        <div className="flex justify-center mb-6">
          <SigilPortalIcon />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-3xl font-semibold mb-1">🔐 Portal Gate</h1>
          <p className="text-sm text-purple-200">You’ve reached the sacred threshold to upgrade your token to an official AXPT account.</p>
          <p className="text-xs text-purple-400 mt-1">Let your journey deepen.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm text-gray-300 mb-1">Email Address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${styles.inputField} w-full px-4 py-2 rounded-md bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
          </div>

          <div>
            <label htmlFor="pin" className="block text-sm text-gray-300 mb-1">Set Your Access PIN</label>
            <input
              id="pin"
              type="password"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className={`${styles.inputField} w-full px-4 py-2 font-bold text-lg rounded-md bg-gray-900 text-white border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600`}
            />
            <p className="text-xs text-purple-400 mt-1">This PIN is your cipher key. Memorize and protect it.</p>
          </div>

          <div>
            <label htmlFor="confirmPin" className="block text-sm text-gray-300 mb-1">Confirm Access PIN</label>
            <input
              id="confirmPin"
              type="password"
              required
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className={`${styles.inputField} w-full px-4 py-2 font-semibold text-lg rounded-md bg-gray-900 text-white border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600`}
            />
            {pinError && (
              <p className="text-xs text-red-400 mt-1">{pinError}</p>
            )}
          </div>

          <div>
            <label htmlFor="tier" className="block text-sm text-gray-300 mb-1">Select Your Tier</label>
            <select
              id="tier"
              value={tier}
              onChange={(e) => setTier(e.target.value as Tier)}
              className="w-full px-4 py-2 rounded-md bg-gray-900 text-white border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {tierOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {autoDetectedTier && (
              <p className="text-xs text-green-400 mt-1">Auto-detected: <strong>{autoDetectedTier}</strong></p>
            )}
          </div>

          <button
            type="submit"
            className={`${styles.submitButton} w-full px-6 py-3 rounded-md text-white font-semibold hover:shadow-xl hover:bg-purple-700 transition`}
          >
            🚀 Upgrade Account
          </button>

          {message && (
            <p className="text-center text-sm mt-2 text-purple-300 animate-pulse">{message}</p>
          )}
        </form>

        <p className="text-xs text-gray-500 mt-6 text-center">
          Handle your credentials with sacred care. Welcome to the realm.
        </p>
      </div>
    </div>
  );
}