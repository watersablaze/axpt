'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface Wallet {
  address: string;
  balance: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Fetch wallet data when user is authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      fetchWalletData();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status]);

  // Fetch wallet data from backend
  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching wallet data for:', session?.user?.email);
      
      const response = await fetch('/api/dashboard', { cache: 'no-store' });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.wallet) {
        console.log('✅ Wallet data fetched:', data.wallet);
        setWallet(data.wallet);
      } else {
        throw new Error(data.error || 'Wallet data not found.');
      }
    } catch (err) {
      console.error('❌ Error fetching wallet data:', err);
      setError(err instanceof Error ? err.message : 'Unexpected error occurred.');
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  // Copy wallet address to clipboard
  const copyToClipboard = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      alert('Wallet address copied to clipboard!');
    }
  };

  // Send funds via backend API
  const sendFunds = async () => {
    try {
      if (!recipientAddress || !sendAmount) {
        throw new Error('Recipient address and amount are required.');
      }

      setIsSending(true);
      setError(null);

      const response = await fetch('/api/transactions/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipientAddress,
          amount: sendAmount,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send transaction.');
      }
      
      alert(`✅ Transaction successful! Hash: ${result.txHash}`);
      setSendAmount('');
      setRecipientAddress('');
      fetchWalletData(); // Refresh wallet balance
    } catch (err) {
      console.error('❌ Transaction error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send transaction.');
    } finally {
      setIsSending(false);
    }
  };

  if (loading) return <Skeleton count={3} height={30} />;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome, {session?.user?.name || 'User'}!</h1>
      <p>Your email: {session?.user?.email}</p>

      <h2>Wallet Details</h2>
      <p>
        <strong>Address:</strong> {wallet?.address || 'N/A'} 
        <button onClick={() => copyToClipboard(wallet?.address || '')}>Copy</button>
      </p>
      <p>
        <strong>Balance:</strong> {wallet?.balance === '0.00' ? 'No funds available' : `${wallet?.balance} ETH`}
      </p>

      <h2>Send Funds</h2>
      <input 
        type="text" 
        placeholder="Recipient Address" 
        value={recipientAddress} 
        onChange={(e) => setRecipientAddress(e.target.value)} 
        disabled={isSending}
      />
      <input 
        type="text" 
        placeholder="Amount (ETH)" 
        value={sendAmount} 
        onChange={(e) => setSendAmount(e.target.value)} 
        disabled={isSending}
      />
      <button onClick={sendFunds} disabled={isSending}>
        {isSending ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}