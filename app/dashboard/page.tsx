"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import Wallet from "./Wallet";
import TransactionHistory from "./TransactionHistory";
import MintStablecoin from "./MintStablecoin";
import RedeemStablecoin from "./RedeemStablecoin";
import BulletinBoard from "./BulletinBoard";
import Modal from "./Modal"; // ✅ Import Modal component
import styles from "@/app/dashboard/Dashboard.module.css";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false); // ✅ Sidebar starts open

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

  const toggleSection = useCallback((section: string) => {
    setActiveSection(section);
  }, []);

  const closeSection = useCallback(() => {
    setActiveSection(null);
  }, []);

  return (
    <div className={`${styles.dashboard} ${activeSection ? styles.dimmed : ""}`}>
      <DashboardHeader />
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} setActiveSection={setActiveSection} />
      
        {/* ✅ Welcome Section - Hidden when a modal is active */}
        <div className={`${styles.welcomeSection} ${activeSection ? styles.hidden : ""}`}>
          {session?.user && (
            <h2 className={styles.welcomeMessage}>
              Welcome, <strong>{session.user.name || "User"}</strong>!
            </h2>
          )}

      {/* ✅ Moved from DashboardHeader.tsx */}
      <p className={styles.sectionDescription}>Manage your assets seamlessly.</p>

      <p className={styles.dateTime}>
        <strong>Current Time:</strong> {currentDateTime}
      </p>
    </div>

      {/* ✅ Modal - Controls Expanded Section Display */}
      <Modal isOpen={!!activeSection} onClose={closeSection}>
        {activeSection === "wallet" && <Wallet />}
        {activeSection === "stablecoin" && (
          <>
            <MintStablecoin />
            <RedeemStablecoin />
          </>
        )}
        {activeSection === "transactions" && <TransactionHistory />}
        {activeSection === "bulletin" && <BulletinBoard />}
      </Modal>
    </div>
  );
}