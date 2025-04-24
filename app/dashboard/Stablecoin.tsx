"use client";

import { useState, useEffect } from "react";
import styles from "./Stablecoin.module.css";

interface StablecoinProps {
  closeHUD: () => void;
}

export default function Stablecoin({ closeHUD }: StablecoinProps) {
  const [balance, setBalance] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add("hud-active");
    return () => document.body.classList.remove("hud-active");
  }, []);

  // Fetch stablecoin balance
  const fetchBalance = async () => {
    try {
      const response = await fetch("/api/stablecoin/balance");
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      
      const data = await response.json();
      setBalance(data.balance);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  return (
    <div className={styles.stablecoinHUD} onClick={closeHUD}>
      <div className={styles.stablecoinContainer} onClick={(e) => e.stopPropagation()}>
        <h2>Stablecoin Overview</h2>
        <p>Balance: {balance} USDC</p>
        <p>Last Updated: {lastUpdated || "Loading..."}</p>
      </div>
    </div>
  );
}