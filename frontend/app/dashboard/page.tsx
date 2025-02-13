"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "../../../components/Sidebar"; // ✅ Import Sidebar
import Header from "../../../components/Header"; // ✅ Import Reusable Header Component
import GoldPrice from "../../../components/GoldPrice"; // ✅ Added Gold Price Component
import MintStablecoin from "../../../components/MintStablecoin"; // ✅ Moved to separate component
import RedeemStablecoin from "../../../components/RedeemStablecoin"; // ✅ Moved to separate component
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentDateTime, setCurrentDateTime] = useState("");

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
      router.push("/login");
    }
  }, [status]);

  return (
    <div className={styles.dashboard}>
      <Header />

      <div className={styles.container}>
        <Sidebar />

        {/* ✅ Main Content */}
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
            <GoldPrice /> {/* ✅ Now part of the dashboard */}
          </div>

          {/* ✅ Stablecoin Interaction */}
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