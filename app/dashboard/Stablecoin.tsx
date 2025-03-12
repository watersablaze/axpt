"use client";

import { useState, useEffect } from "react";
import { ArrowUpCircle, ArrowDownCircle, DollarSign } from "lucide-react";
import { toast } from "sonner";
import styles from "./Stablecoin.module.css";

interface StablecoinProps {
  closeHUD: () => void;
}

export default function Stablecoin({ closeHUD }: StablecoinProps) {
  const [balance, setBalance] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"mint" | "redeem" | null>(null);

  // ✅ HUD Mode - Fullscreen Animation & Responsive Scroll
  useEffect(() => {
    document.body.classList.add("hud-active");
    return () => document.body.classList.remove("hud-active");
  }, []);

  // ✅ Fetch stablecoin balance from API
  const fetchBalance = async () => {
    try {
      console.log("Fetching stablecoin balance...");

      const response = await fetch("/api/stablecoin/balance");
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setBalance(data.balance);
      setLastUpdated(new Date().toLocaleTimeString());

      toast.success("✅ Stablecoin balance updated successfully!");
    } catch (error) {
      console.error("❌ Failed to fetch stablecoin balance:", error);
      toast.error("❌ Failed to update balance");
    }
  };

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.stablecoinHUD} onClick={closeHUD}>
      <div className={styles.stablecoinContainer} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.stablecoinTitle}>Stablecoin Dashboard</h2>

        {/* ✅ Balance Section */}
        <div className={styles.balanceSection}>
          <h3 className={styles.balanceLabel}>Stablecoin Balance:</h3>
          <p className={styles.balance}>
            <strong>{balance.toFixed(2)} USDC</strong>
          </p>
        </div>

        {/* ✅ Last Updated */}
        <p className={styles.lastUpdated}>🕒 Last Updated: {lastUpdated || "Fetching..."}</p>

        {/* ✅ Mint / Redeem Options */}
        <div className={styles.actions}>
          <button onClick={() => { setModalOpen(true); setModalType("mint"); }} className={styles.mintButton}>
            <ArrowUpCircle size={20} /> Mint Stablecoin
          </button>
          <button onClick={() => { setModalOpen(true); setModalType("redeem"); }} className={styles.redeemButton}>
            <ArrowDownCircle size={20} /> Redeem Stablecoin
          </button>
        </div>

        {/* ✅ Modal for Mint / Redeem */}
        {modalOpen && modalType && (
          <div className={styles.modal}>
            <h3>{modalType === "mint" ? "Mint Stablecoin" : "Redeem Stablecoin"}</h3>
            <p>Feature coming soon...</p>
            <button className={styles.closeModal} onClick={() => setModalOpen(false)}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}