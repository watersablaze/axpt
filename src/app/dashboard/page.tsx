'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
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
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      fetchWalletData();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
  
      console.log('✅ Fetching wallet data for:', session?.user?.email);
  
      const response = await fetch('/api/dashboard', { cache: 'no-store' });
  
      if (!response.ok) {
        throw new Error(`Error fetching wallet data: ${response.status}`);
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
      } else {
        throw new Error('MetaMask is not installed.');
      }
    } catch (err) {
      console.error('❌ Error connecting wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet.');
    }
  };

  const sendFunds = async () => {
    try {
      if (!window.ethereum || !wallet?.address) {
        throw new Error('Please connect your wallet first.');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const transaction = await signer.sendTransaction({
        to: recipientAddress,
        value: ethers.utils.parseEther(sendAmount),
      });

      alert(`Transaction sent! Hash: ${transaction.hash}`);
      setSendAmount('');
      setRecipientAddress('');
    } catch (err) {
      console.error('❌ Transaction error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send transaction.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Wallet address copied to clipboard!');
  };

  if (loading) return <Skeleton count={3} height={30} />;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome, {session?.user?.name || 'User'}!</h1>
      <p>Your email: {session?.user?.email}</p>

      <h2>Wallet</h2>
      <p><strong>Address:</strong> {wallet?.address || 'N/A'} <button onClick={() => copyToClipboard(wallet?.address || '')}>Copy</button></p>
      <p><strong>Balance:</strong> {wallet?.balance} ETH</p>

      <button onClick={connectWallet}>Connect Wallet</button>

      <h2>Send Funds</h2>
      <input type="text" placeholder="Recipient Address" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} />
      <input type="text" placeholder="Amount (ETH)" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} />
      <button onClick={sendFunds}>Send</button>
    </div>
  );
}