"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import DashboardHeader from "./DashboardHeader";
import Sidebar from "./Sidebar";
import Wallet from "./Wallet";
import TransactionHistory from "./TransactionHistory";
import MintStablecoin from "./MintStablecoin";
import RedeemStablecoin from "./RedeemStablecoin";
import BulletinBoard from "./BulletinBoard";
import styles from "@/app/dashboard/Dashboard.module.css";

export default function Dashboard() {
  const { data: session, status } = useSession(); // ✅ session is now used
  const router = useRouter();
  const [currentDateTime, setCurrentDateTime] = useState("");

  // ✅ Memoized function for updating time
  const updateDateTime = useCallback(() => {
    setCurrentDateTime(new Date().toLocaleString());
  }, []);

  // ✅ Ensures time updates every second and cleans up properly
  useEffect(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, [updateDateTime]);

  // ✅ Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login"); // 🔄 Used `replace()` to avoid back navigation issue
    }
  }, [status, router]);

  return (
    <div className={styles.dashboard}>
      <DashboardHeader />
      <Sidebar />

      <div className={styles.container}>
        <main className={styles.mainContent}>
          {/* ✅ Left Panel for Title & Description */}
          <div className={styles.leftPanel}>
          

            {/* ✅ Display User Info (Fixes Unused Session Warning) */}
            {session?.user && (
              <p className={styles.userInfo}>
                Welcome, <strong>{session.user.name || "User"}</strong>! ({session.user.email})
              </p>
            )}

            {/* ✅ Display Current Time */}
            <p className={styles.dateTime}>
              <strong>Current Time:</strong> {currentDateTime}
            </p>

            <BulletinBoard /> {/* ✅ Integrating the Bulletin Board */}

            {/* ✅ Sleek Stablecoin Management Section */}
            <div className={styles.stablecoinManagement}>
              <MintStablecoin />
              <RedeemStablecoin />
            </div>
          </div>

          {/* ✅ Right Panel with Wallet & Transaction History */}
          <div className={styles.rightPanel}>
            <Wallet />
            <TransactionHistory />
          </div>
        </main>
      </div>
    </div>
  );
}