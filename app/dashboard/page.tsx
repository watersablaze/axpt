"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Wallet, Banknote, History, Newspaper } from "lucide-react"; // ✅ Icons for toggles
import DashboardHeader from "./DashboardHeader";
import Sidebar from "./Sidebar";
import WalletComponent from "./Wallet";
import TransactionHistory from "./TransactionHistory";
import MintStablecoin from "./MintStablecoin";
import RedeemStablecoin from "./RedeemStablecoin";
import BulletinBoard from "./BulletinBoard";
import styles from "@/app/dashboard/Dashboard.module.css";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // ✅ Updates the clock every second
  const updateDateTime = useCallback(() => {
    setCurrentDateTime(new Date().toLocaleString());
  }, []);

  useEffect(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, [updateDateTime]);

  // ✅ Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // ✅ Toggle sections on icon click
  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className={styles.dashboard}>
      <DashboardHeader />
      <Sidebar />

      <div className={styles.container}>
        <main className={styles.mainContent}>
          {/* ✅ Welcome Message & Time (Now inside mainContent) */}
          <div className={styles.welcomeSection}>
            {session?.user && (
              <h2 className={styles.welcomeMessage}>
                Welcome, <strong>{session.user.name || "User"}</strong>!
              </h2>
            )}
            <p className={styles.dateTime}>
              <strong>Current Time:</strong> {currentDateTime}
            </p>
          </div>

          {/* ✅ Toggle Control Panel */}
          <div className={styles.togglePanel}>
            <button onClick={() => toggleSection("wallet")} className={activeSection === "wallet" ? styles.active : ""}>
              <Wallet size={28} /> Wallet
            </button>
            <button onClick={() => toggleSection("stablecoin")} className={activeSection === "stablecoin" ? styles.active : ""}>
              <Banknote size={28} /> Stablecoin
            </button>
            <button onClick={() => toggleSection("transactions")} className={activeSection === "transactions" ? styles.active : ""}>
              <History size={28} /> Transactions
            </button>
            <button onClick={() => toggleSection("bulletin")} className={activeSection === "bulletin" ? styles.active : ""}>
              <Newspaper size={28} /> Bulletin
            </button>
          </div>

          {/* ✅ Expandable Sections */}
          {activeSection === "wallet" && (
            <div className={styles.expandedSection}>
              <WalletComponent />
            </div>
          )}

          {activeSection === "stablecoin" && (
            <div className={styles.expandedSection}>
              <MintStablecoin />
              <RedeemStablecoin />
            </div>
          )}

          {activeSection === "transactions" && (
            <div className={styles.expandedSection}>
              <TransactionHistory />
            </div>
          )}

          {activeSection === "bulletin" && (
            <div className={styles.expandedSection}>
              <BulletinBoard />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}