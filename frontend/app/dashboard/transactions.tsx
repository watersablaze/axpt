"use client";
import { useEffect, useState } from "react";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    async function fetchTransactions() {
      const res = await fetch("/api/user/transactions"); // Assume we have a backend route for this
      const data = await res.json();
      setTransactions(data);
    }
    fetchTransactions();
  }, []);

  return (
    <div className="transactionHistory">
      <h2>Transaction History</h2>
      <ul>
        {transactions.map((tx) => (
          <li key={tx.id}>
            {tx.type}: {tx.amount} GLDUSD → {tx.status}
          </li>
        ))}
      </ul>
    </div>
  );
}