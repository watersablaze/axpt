'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

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

  useEffect(() => {
    // Handle authentication state and fetch wallet data
    const handleSession = async () => {
      if (status === 'authenticated') {
        if (!session?.user) {
          console.error('Invalid session data. Redirecting to login.');
          router.push('/login');
          return;
        }

        console.log('Authenticated user:', session.user);

        // Fetch wallet data for the authenticated user
        await fetchWalletData();
      } else if (status === 'unauthenticated') {
        router.push('/login'); // Redirect unauthenticated users
      }
    };

    handleSession();
  }, [status, session, router]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard'); // Adjust to your API endpoint
      const data = await response.json();

      if (response.ok && data.wallet) {
        setWallet(data.wallet);
        setError(null);
      } else {
        console.error('Error fetching wallet data:', data.error);
        setError(data.error || 'Failed to fetch wallet data.');
        setWallet(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching wallet info:', err);
      setError('An unexpected error occurred while fetching wallet data.');
    } finally {
      setLoading(false);
    }
  };

  // Function to connect MetaMask wallet
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        const balance = await provider.getBalance(accounts[0]);
        const balanceInEther = ethers.utils.formatEther(balance);

        setWallet({
          address: accounts[0],
          balance: balanceInEther,
        });

        console.log('Connected account:', accounts[0]);
      } else {
        console.error('MetaMask not detected');
        setError('MetaMask is not installed. Please install it to connect.');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet. Please try again.');
    }
  };

  // Clear wallet state on logout
  const handleLogout = () => {
    setWallet(null); // Clear wallet state
    router.push('/api/auth/signout'); // Redirect to logout API
  };

  if (status === 'loading') {
    return <p>Loading session...</p>;
  }

  // Skeleton loader for dashboard content
  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Loading Dashboard...</h1>
        <div style={{ marginTop: '20px' }}>
          <div className="skeleton" style={{ width: '300px', height: '30px' }}></div>
          <div className="skeleton" style={{ width: '400px', height: '30px', marginTop: '10px' }}></div>
          <div className="skeleton" style={{ width: '250px', height: '30px', marginTop: '10px' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Error</h1>
        <p>{error}</p>
        <button
          onClick={fetchWalletData}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f39c12',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '20px',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome, {session?.user?.name || 'User'}!</h1>
      <p>Your email: {session?.user?.email}</p>
      <div style={{ marginTop: '20px' }}>
        <h2>Wallet Information</h2>
        <p>
          <strong>Address:</strong> {wallet?.address || 'Not available'}
        </p>
        <p>
          <strong>Balance:</strong> {wallet?.balance || '0.00'} ETH
        </p>
      </div>
      <button
        onClick={connectWallet}
        style={{
          padding: '10px 20px',
          backgroundColor: '#0070f3',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: '20px',
        }}
      >
        Connect Wallet
      </button>
      <button
        onClick={handleLogout}
        style={{
          padding: '10px 20px',
          backgroundColor: '#e74c3c',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: '20px',
        }}
      >
        Logout
      </button>
    </div>
  );
}