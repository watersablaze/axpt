"use client";

import { useState } from "react";
import styles from "./TransactionModal.module.css";

interface TransactionModalProps {
    type: "send" | "receive" | "deposit" | "withdraw";
    selectedCrypto: { name: string; symbol: string; network: string };  // ✅ Now accepts an object
    onClose: () => void;
    onTransaction: (amount: number) => void;
  }

export default function TransactionModal({ type, selectedCrypto, onClose, onTransaction }: TransactionModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [recipient, setRecipient] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // ✅ Handles Transaction Execution
  const handleTransaction = () => {
    if (amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (type === "send" && !recipient) {
      alert("Please enter a recipient address.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      onTransaction(amount);
      setLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>
          {type === "send" && `Send ${selectedCrypto}`}
          {type === "receive" && `Receive ${selectedCrypto}`}
          {type === "deposit" && "Deposit Fiat"}
          {type === "withdraw" && "Withdraw Fiat"}
        </h2>

        {/* ✅ Amount Input */}
        <label className={styles.inputLabel}>Amount</label>
        <input
          type="number"
          min="0"
          className={styles.inputField}
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
          placeholder="Enter amount"
        />

        {/* ✅ Recipient Input for Sending Crypto */}
        {type === "send" && (
          <>
            <label className={styles.inputLabel}>Recipient Address</label>
            <input
              type="text"
              className={styles.inputField}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter recipient address"
            />
          </>
        )}

        {/* ✅ Action Buttons */}
        <div className={styles.modalActions}>
          <button className={styles.cancelButton} onClick={onClose}>Cancel</button>
          <button className={styles.confirmButton} onClick={handleTransaction} disabled={loading}>
            {loading ? "Processing..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}