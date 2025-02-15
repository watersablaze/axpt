"use client";

import { useState } from "react";
import styles from "@/components/Wallet.module.css";
import { Eye, EyeOff } from "lucide-react"; // Icon library for visibility toggle

export default function Wallet() {
  const [balanceVisible, setBalanceVisible] = useState(false);
  const userBalance = "2.345 ETH"; // Mock balance, replace with API call

  return (
    <div className={styles.walletContainer}>
      <h3>Your Wallet</h3>
      <div className={styles.walletBox}>
        <p>{balanceVisible ? userBalance : "•••••• ETH"}</p>
        <button
          className={styles.visibilityButton}
          onClick={() => setBalanceVisible(!balanceVisible)}
        >
          {balanceVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}