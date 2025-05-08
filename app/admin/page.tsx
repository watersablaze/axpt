"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import UserList from "./components/UserList";
import TransactionList from "./components/TransactionList";
import styles from "./AdminPanel.module.css";
import { Loader } from "lucide-react";

export default function AdminDashboard() {
  // ✅ Prevent SSR crash by ensuring this only runs client-side
  if (typeof window === "undefined") return null;

  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
    } else {
      setLoading(false);
    }
  }, [session, status, router]);

  if (loading) {
    return (
      <div className={styles.loaderWrapper}>
        <Loader className={styles.loader} />
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <UserList />
      <TransactionList />
    </div>
  );
}