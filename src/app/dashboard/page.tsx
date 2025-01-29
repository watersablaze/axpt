"use client"; 

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Copy, Send, Wallet as WalletIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './Dashboard.module.css';


interface Wallet {
  address: string;
  balance: string;
}

interface Transaction {
  id: string;
  to: string;
  amount: string;
  timestamp: string;
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

  useEffect(() => {
    if (status === 'authenticated') {
      fetchWalletData();
      fetchTransactionHistory();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/dashboard', { cache: 'no-store' });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      setWallet(data.wallet);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error occurred.');
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionHistory = async () => {
    try {
      const response = await fetch('/api/transactions/history');
      if (!response.ok) throw new Error('Failed to load transactions.');
      const data = await response.json();
      setTransactions(data.transactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Wallet address copied to clipboard!');
  };

  const sendFunds = async () => {
    try {
      if (!recipientAddress || !sendAmount) throw new Error('Recipient and amount required.');
      const response = await fetch('/api/transactions/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipientAddress, amount: sendAmount }),
      });
      if (!response.ok) throw new Error('Transaction failed.');
      const result = await response.json();
      toast.success(`Transaction successful! ID: ${result.transactionId}`);
      setSendAmount('');
      setRecipientAddress('');
      fetchWalletData();
      fetchTransactionHistory();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send transaction.');
    }
  };

  if (loading) return <Skeleton className='w-full h-40' />;
  if (error) return <p className='text-red-500'>{error}</p>;

  return (
    <div className='flex flex-col items-center p-6 space-y-6'>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center'
      >
        <h1 className='text-3xl font-bold'>Welcome, {session?.user?.name || 'User'}!</h1>
        <p className='text-gray-500'>{session?.user?.email}</p>
      </motion.div>

      <Card className='w-full max-w-lg shadow-md'>
        <CardContent className='p-6 space-y-4'>
          <h2 className='text-xl font-bold flex items-center gap-2'><WalletIcon /> Wallet Details</h2>
          <p className='text-sm flex items-center gap-2'>
            <span className='font-mono'>{wallet?.address || 'N/A'}</span>
            <Button size='small' onClick={() => copyToClipboard(wallet?.address || '')}><Copy size={16} /></Button>
          </p>
          <p className='text-lg font-bold'>Balance: {wallet?.balance || '0.00'} ETH</p>
        </CardContent>
      </Card>

      <Card className='w-full max-w-lg shadow-md'>
        <CardContent className='p-6 space-y-4'>
          <h2 className='text-xl font-bold flex items-center gap-2'><Send /> Send Funds</h2>
          <Input placeholder='Recipient Address' value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} />
          <Input placeholder='Amount (ETH)' type='number' value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} />
          <Button onClick={sendFunds}>Send</Button>
        </CardContent>
      </Card>

      <Card className='w-full max-w-lg shadow-md'>
        <CardContent className='p-6 space-y-4'>
          <h2 className='text-xl font-bold'>Recent Transactions</h2>
          {transactions.length === 0 ? (
            <p className='text-gray-500'>No recent transactions.</p>
          ) : (
            <ul className='space-y-2'>
              {transactions.map((tx) => (
                <li key={tx.id} className='text-sm border-b pb-2'>
                  <strong>To:</strong> {tx.to} | <strong>Amount:</strong> {tx.amount} ETH | <strong>Time:</strong> {new Date(tx.timestamp).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
