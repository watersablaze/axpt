"use client";

import { useEffect, useState } from "react";
import styles from "./TransactionHistory.module.css";

interface Transaction {
  id: string;
  type: string;
  amount: string;
  status: string;
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Mock Transactions (Replace with API Fetch Later)
  useEffect(() => {
    setTimeout(() => {
      setTransactions([
        { id: "1", type: "Deposit", amount: "0.5 ETH", status: "Completed" },
        { id: "2", type: "Withdrawal", amount: "1.2 ETH", status: "Pending" },
        { id: "3", type: "Swap", amount: "300 USDC → 0.2 ETH", status: "Completed" }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className={styles.transactionContainer}>
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
  );
}