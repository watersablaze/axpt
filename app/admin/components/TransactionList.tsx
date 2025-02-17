"use client";

import { useEffect, useState } from "react";
import styles from "./TransactionList.module.css";
import { Loader, CheckCircle, XCircle } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  date: string;
}

export default function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [dateRange, setDateRange] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async (filters = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/transactions/filter?${query}`);
      const data = await response.json();
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    const filters: Record<string, string> = {};
    if (filterType !== "all") filters.type = filterType;
    if (minAmount) filters.minAmount = minAmount;
    if (maxAmount) filters.maxAmount = maxAmount;
    if (dateRange) filters.date = dateRange;

    fetchTransactions(filters);
  };

  if (loading) return <p className={styles.loading}><Loader className={styles.loader} /> Loading transactions...</p>;

  return (
    <div className={styles.transactionContainer}>
      <h3>Transaction History</h3>

      {/* ✅ Filters */}
      <div className={styles.filterContainer}>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="Deposit">Deposit</option>
          <option value="Withdrawal">Withdrawal</option>
          <option value="Swap">Swap</option>
        </select>

        <input 
          type="number" 
          placeholder="Min Amount" 
          value={minAmount} 
          onChange={(e) => setMinAmount(e.target.value)} 
        />
        <input 
          type="number" 
          placeholder="Max Amount" 
          value={maxAmount} 
          onChange={(e) => setMaxAmount(e.target.value)} 
        />
        <input 
          type="date" 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)} 
        />
        <button onClick={applyFilters}>Apply Filters</button>
      </div>

      {/* ✅ Transaction List */}
      {transactions.length === 0 ? (
        <p className={styles.noTransactions}>No transactions found.</p>
      ) : (
        <ul className={styles.transactionList}>
          {transactions.map((tx) => (
            <li key={tx.id} className={styles.transactionItem}>
              <p><strong>{tx.type}</strong>: {tx.amount} USD</p>
              <p>{new Date(tx.date).toLocaleDateString()}</p>
              <p>Status: {tx.status === "Completed" ? 
                <CheckCircle className={styles.completed} /> : 
                <XCircle className={styles.pending} />}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}