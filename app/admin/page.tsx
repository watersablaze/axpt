"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./Admin.module.css";

interface Transaction {
  id: string;
  type: string;
  amount: string;
  status: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Redirect if not an admin (Fixes TypeScript issue)
    if (status === "unauthenticated" || !session?.user?.isAdmin) {
      router.push("/login");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user?.isAdmin) {
      // ✅ Fetch transactions
      const fetchTransactions = async () => {
        try {
          const res = await fetch("/api/transactions/fetch");
          const data = await res.json();
          setTransactions(data || []);
        } catch (error) {
          console.error("Error fetching transactions:", error);
        }
      };

      // ✅ Fetch user list
      const fetchUsers = async () => {
        try {
          const res = await fetch("/api/admin/users");
          const data = await res.json();
          setUsers(data || []);
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      };

      fetchTransactions();
      fetchUsers();
      setLoading(false);
    }
  }, [session]);

  if (loading) return <p className={styles.loading}>Loading admin panel...</p>;

  return (
    <div className={styles.adminContainer}>
      <h2 className={styles.title}>Admin Dashboard</h2>

      {/* ✅ Transaction Management */}
      <section className={styles.section}>
        <h3>Recent Transactions</h3>
        <ul className={styles.transactionList}>
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <li key={tx.id} className={styles.transactionItem}>
                <p><strong>{tx.type}</strong>: {tx.amount}</p>
                <p>Status: {tx.status}</p>
              </li>
            ))
          ) : (
            <p>No transactions found.</p>
          )}
        </ul>
      </section>

      {/* ✅ User Management */}
      <section className={styles.section}>
        <h3>Users</h3>
        <ul className={styles.userList}>
          {users.length > 0 ? (
            users.map((user) => (
              <li key={user.id} className={styles.userItem}>
                <p><strong>{user.name}</strong> ({user.email})</p>
              </li>
            ))
          ) : (
            <p>No users found.</p>
          )}
        </ul>
      </section>
    </div>
  );
}