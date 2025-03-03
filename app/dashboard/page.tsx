"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Wallet2, DollarSign, ClipboardList, ScrollText, X } from "lucide-react";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import Wallet from "./Wallet";
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
  const [indicatorTop, setIndicatorTop] = useState<number | null>(null);

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

  useEffect(() => {
    console.log("Active Section:", activeSection); // ✅ Debugging
  }, [activeSection]);

  // ✅ Toggle sections on icon click
  const toggleSection = useCallback(
    (section: string, event?: React.MouseEvent<HTMLButtonElement>) => {
      if (activeSection === section) return;
      setActiveSection(section);
      if (event) {
        setIndicatorTop(event.currentTarget.offsetTop);
      }
    },
    [activeSection]
  );

  const closeSection = useCallback(() => {
    setActiveSection(null);
    setIndicatorTop(null);
  }, []);

  useEffect(() => {
    if (activeSection === null) {
      setIndicatorTop(null);
    }
  }, [activeSection]);

  return (
    <div className={styles.dashboard}>
      <DashboardHeader />
      <Sidebar />

      {/* ✅ Reintroduced Overlay for Dim Effect */}
      {activeSection && (
        <div
          className={styles.overlay}
          onClick={() => {
            console.log("Overlay Clicked - Closing Section"); // 🔎 Debugging
            closeSection();
          }}
        ></div>
      )}

      <div className={styles.container}>
        <main className={styles.mainContent}>
          {/* ✅ Welcome Message & Time */}
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

          {/* ✅ Vertical Toggle Panel */}
          <div className={styles.togglePanel}>
            {indicatorTop !== null && (
              <div className={styles.toggleIndicator} style={{ top: `${indicatorTop}px` }}></div>
            )}

            <button onClick={(e) => toggleSection("wallet", e)} className={activeSection === "wallet" ? styles.active : ""}>
              <Wallet2 size={28} /> Wallet
            </button>
            <button onClick={(e) => toggleSection("stablecoin", e)} className={activeSection === "stablecoin" ? styles.active : ""}>
              <DollarSign size={28} /> Stablecoin
            </button>
            <button onClick={(e) => toggleSection("transactions", e)} className={activeSection === "transactions" ? styles.active : ""}>
              <ClipboardList size={28} /> Transactions
            </button>
            <button onClick={(e) => toggleSection("bulletin", e)} className={activeSection === "bulletin" ? styles.active : ""}>
              <ScrollText size={28} /> Bulletin
            </button>
          </div>

          {/* ✅ Expandable Sections */}
          {activeSection && (
            <>
              {/* ✅ Background Click Layer - Closes when clicking outside */}
              <div className={styles.expandedSectionWrapper}>
              <div
              className={styles.expandedSection}
              onClick={(e) => {
                console.log("Clicked Inside ExpandedSection"); // ✅ Debugging
                e.stopPropagation();
              }}
            >
                  {/* ✅ Close Button */}
                  <button
                    className={styles.exitButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Close Button Clicked - Closing Section"); // 🔎 Debugging
                      setActiveSection(null);
                    }}
                  >
                    <X size={24} /> Close
                  </button>

                  {/* ✅ Render Active Component */}
                  {activeSection === "wallet" && <Wallet />}
                  {activeSection === "stablecoin" && (
                    <>
                      <MintStablecoin />
                      <RedeemStablecoin />
                    </>
                  )}
                  {activeSection === "transactions" && <TransactionHistory />}
                  {activeSection === "bulletin" && <BulletinBoard />}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}