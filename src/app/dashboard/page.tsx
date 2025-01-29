'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import styles from './Dashboard.module.css';

interface Wallet {
  address: string;
  balance: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  status: string;
  date: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');

  // Fetch wallet data & transactions when authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      fetchWalletData();
      fetchTransactionHistory();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status]);

  // Fetch Wallet Data
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

  // Fetch Recent Transactions (Last 5)
  const fetchTransactionHistory = async () => {
    try {
      const response = await fetch('/api/transactions/recent');

      if (!response.ok) {
        throw new Error('Failed to load transactions.');
      }

      const data = await response.json();
      setTransactions(data.transactions);
    } catch (err) {
      console.error('❌ Error fetching transactions:', err);
    }
  };

  // Copy wallet address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Wallet address copied to clipboard!');
  };

  // Send funds
  const sendFunds = async () => {
    try {
      if (!recipientAddress || !sendAmount) {
        throw new Error('Recipient address and amount are required.');
      }
      const response = await fetch('/api/transactions/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipientAddress, amount: sendAmount }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send transaction.');
      }

      alert(`Transaction successful! Hash: ${result.txHash}`);
      setSendAmount('');
      setRecipientAddress('');
    } catch (err) {
      console.error('❌ Transaction error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send transaction.');
    }
  };

  if (loading) return <Skeleton count={3} height={30} />;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.dashboard}>
      <div className={styles.welcomeBanner}>
        <h1>Welcome, {session?.user?.name || 'User'}!</h1>
        <p>Your email: {session?.user?.email}</p>
      </div>

      {/* Wallet Section */}
      <div className={styles.walletSection}>
        <h2>Wallet Details</h2>
        <p>
          <strong>Address:</strong> {wallet?.address || 'N/A'} 
          <button className={styles.copyButton} onClick={() => copyToClipboard(wallet?.address || '')}>
            Copy
          </button>
        </p>
        <p className={styles.balance}>
          <strong>Balance:</strong> {wallet?.balance === '0.00' ? 'No funds available' : `${wallet?.balance} ETH`}
        </p>
      </div>

      {/* Recent Transactions */}
      <div className={styles.transactionsSection}>
        <h2>Recent Transactions</h2>
        {transactions.length === 0 ? (
          <p>No recent transactions.</p>
        ) : (
          <ul className={styles.transactionsList}>
            {transactions.map((tx) => (
              <li key={tx.id} className={`${styles.transactionItem} ${styles[tx.status]}`}>
                <span className={styles.txType}>{tx.type}</span>
                <span className={styles.txAmount}>{tx.amount} ETH</span>
                <span className={styles.txStatus}>{tx.status}</span>
                <span className={styles.txDate}>{new Date(tx.date).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
        <button className={styles.viewAllButton} onClick={() => router.push('/transactions')}>
          View All Transactions
        </button>
      </div>

      {/* Send Funds Section */}
      <div className={styles.sendFundsSection}>
        <h2>Send Funds</h2>
        <input 
          type="text" 
          placeholder="Recipient Address" 
          className={styles.inputField}
          value={recipientAddress} 
          onChange={(e) => setRecipientAddress(e.target.value)} 
        />
        <input 
          type="text" 
          placeholder="Amount (ETH)" 
          className={styles.inputField}
          value={sendAmount} 
          onChange={(e) => setSendAmount(e.target.value)} 
        />
        <button className={styles.sendButton} onClick={sendFunds}>Send</button>
      </div>
    </div>
  );
}