"use client";

import { useEffect, useState } from "react";
import styles from "./TransactionHistory.module.css";

interface Transaction {
  id: string;
  type: string;
  amount: string;
  status: string;
}

interface TransactionHistoryProps {
  closeHUD: () => void; // ✅ Allows HUD to close when clicking outside
}

export default function TransactionHistory({ closeHUD }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  // ✅ Fetch transactions from API
  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions");
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      
      const data = await response.json();
      setTransactions(data.transactions);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.transactionHUD} onClick={closeHUD}>
      <div className={styles.transactionContainer} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Transaction History</h3>
        {loading ? (
          <p className={styles.loading}>Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className={styles.noTransactions}>No transactions yet.</p>
        ) : (
          <ul className={styles.transactionList}>
            {transactions.map((tx) => (
              <li key={tx.id} className={styles.transactionItem}>
                <p><strong>{tx.type}</strong>: {tx.amount}</p>
                <p>Status: {tx.status}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}