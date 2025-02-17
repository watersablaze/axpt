"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardHeader from "./DashboardHeader";
import Sidebar from "./Sidebar";
import Wallet from "./Wallet";
import TransactionHistory from "./TransactionHistory";
import MintStablecoin from "./MintStablecoin";
import RedeemStablecoin from "./RedeemStablecoin";
import GoldPrice from "./GoldPrice";
import BulletinBoard from "./BulletinBoard";
import styles from "@/app/dashboard/Dashboard.module.css";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentDateTime, setCurrentDateTime] = useState("");

  useEffect(() => {
    const updateDateTime = () => setCurrentDateTime(new Date().toLocaleString());
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);

  return (
    <div className={styles.dashboard}>
      <DashboardHeader />
      <Sidebar />

      <div className={styles.container}>
        <main className={styles.mainContent}>
          {/* ✅ Left Panel for Title & Description */}
          <div className={styles.leftPanel}>
            <h2 className={styles.sectionTitle}>Finance Hub</h2>
            <p className={styles.sectionDescription}>Manage your assets seamlessly.</p>

            <BulletinBoard /> {/* ✅ Integrating the Bulletin Board */}


          {/* ✅ Live Gold Price Section */}
            <div className={styles.goldPriceSection}>
            <GoldPrice />
              </div>


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