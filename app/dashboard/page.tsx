"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardHeader from "./DashboardHeader";
import Sidebar from "./Sidebar";
import MintStablecoin from "./MintStablecoin";
import RedeemStablecoin from "./RedeemStablecoin";
import GoldPrice from "@/components/GoldPrice";
import Wallet from "./Wallet";
import styles from "@/app/dashboard/Dashboard.module.css"; // ✅ Corrected Path

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentDateTime, setCurrentDateTime] = useState("");

  // ✅ Logs Ethereum provider detection
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("Window object detected.");
      if (window.ethereum) {
        console.log("✅ Ethereum provider detected:", window.ethereum);
      } else {
        console.warn("⚠️ No Ethereum provider found. Using fallback JSON-RPC provider.");
      }
    }
  }, []);

  // ✅ Update date & time dynamically
  useEffect(() => {
    const updateDateTime = () => setCurrentDateTime(new Date().toLocaleString());
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Redirect unauthenticated users to login
  useEffect(() => {
    if (status === "unauthenticated") {
      console.warn("⚠️ Unauthenticated user, redirecting to login...");
      router.push("/login");
    }
  }, [status]);

  return (
    <div className={styles.dashboard}>

      <DashboardHeader />

      <div className={styles.container}>
        <Sidebar />

        <main className={styles.mainContent}>
          <h2>Dashboard Overview</h2>
          <p>Welcome to your secure portal.</p>

          {/* ✅ Display Date & Time */}
          <div className={styles.dateTimeContainer}>
            <h3>Current Date & Time</h3>
            <p>{currentDateTime}</p>
          </div>

          {/* ✅ Display Live Gold Price */}
          <div className={styles.goldPriceSection}>
            <h3>Live Gold Price</h3>
            <GoldPrice />
          </div>

          {/* ✅ Wallet Overview */}
          <div className={styles.walletSection}>
            <h3>Wallet Overview</h3>
            <Wallet />
          </div>

          {/* ✅ Stablecoin Management */}
          <div className={styles.stablecoinSection}>
            <h3>Stablecoin Management</h3>
            <MintStablecoin />
            <RedeemStablecoin />
          </div>
        </main>
      </div>
    </div>
  );
}