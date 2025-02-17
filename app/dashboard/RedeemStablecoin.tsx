"use client";

import { useState } from "react";
import styles from "./StablecoinManagement.module.css";

export default function RedeemStablecoin() {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");

  const handleRedeem = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setTransactionStatus("⚠️ Enter a valid amount.");
      return;
    }

    setIsProcessing(true);
    setTransactionStatus("Processing transaction...");

    setTimeout(() => {
      setIsProcessing(false);
      setTransactionStatus("✅ Redemption successful!");
      setAmount(""); // Reset input field
    }, 2000);
  };

  return (
    <div className={styles.redeemContainer}>
      <h3 className={styles.sectionTitle}>Redeem Stablecoins</h3>

      <input
        type="number"
        placeholder="Enter amount"
        className={styles.inputField}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button
        className={styles.actionButton}
        onClick={handleRedeem}
        disabled={isProcessing}
      >
        {isProcessing ? "Processing..." : "Redeem"}
      </button>

      {transactionStatus && (
        <p className={styles.transactionStatus}>{transactionStatus}</p>
      )}
    </div>
  );
}