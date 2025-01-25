'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers'; // Import ethers

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wallet, setWallet] = useState({ address: '', balance: '0.00' });

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/wallet')
        .then((res) => res.json())
        .then((data) => {
          if (data.wallet) {
            setWallet(data.wallet);
          } else {
            console.error('Wallet data not found:', data.error);
          }
        })
        .catch((err) => {
          console.error('Error fetching wallet info:', err);
        });
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      console.log('Connected account:', accounts[0]);
    } else {
      console.error('MetaMask not detected');
    }
  }

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome, {session?.user?.name || 'User'}!</h1>
      <p>Your email: {session?.user?.email}</p>
      <div style={{ marginTop: '20px' }}>
        <h2>Wallet Information</h2>
        <p><strong>Address:</strong> {wallet.address || 'Not available'}</p>
        <p><strong>Balance:</strong> {wallet.balance} ETH</p>
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
        onClick={() => router.push('/api/auth/signout')}
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
        Logout
      </button>
    </div>
  );
}