"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import UserList from "./components/UserList";
import TransactionList from "./components/TransactionList";
import styles from "./AdminPanel.module.css";
import { Loader } from "lucide-react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated" || !session?.user?.isAdmin) {
      router.push("/login");
    } else {
      setLoading(false);
    }
  }, [session, status]);

  if (loading) return <p className={styles.loading}><Loader className={styles.loader} /> Loading admin panel...</p>;

  return (
    <div className={styles.adminContainer}>
      <h2 className={styles.title}>Admin Dashboard</h2>

      <div className={styles.gridContainer}>
        {/* User Management Section */}
        <section className={styles.section}>
          <h3>Users</h3>
          <UserList />
        </section>

        {/* Transactions Section */}
        <section className={styles.section}>
          <h3>Recent Transactions</h3>
          <TransactionList />
        </section>
      </div>
    </div>
  );
}