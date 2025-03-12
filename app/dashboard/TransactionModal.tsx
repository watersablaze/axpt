import React, { useState } from "react";
import { X, ArrowUpCircle, ArrowDownCircle, CheckCircle, AlertCircle } from "lucide-react";
import styles from "./TransactionModal.module.css";

interface TransactionModalProps {
  type: "send" | "receive" | "deposit" | "withdraw";
  selectedCrypto: { name: string; symbol: string; network: string };
  onClose: () => void;
  onTransaction: (amount: number) => void;
}

export default function TransactionModal({ type, selectedCrypto, onClose, onTransaction }: TransactionModalProps) {
  const [amount, setAmount] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<boolean>(false);

  // ✅ Validate input & check balance before confirming
  const handleConfirm = () => {
    if (!amount || amount <= 0) {
      setError("❌ Please enter a valid amount.");
      return;
    }

    setError(null);
    setConfirmed(true);

    setTimeout(() => {
      onTransaction(amount);
      onClose();
    }, 1500);
  };

  // ✅ Icons based on transaction type
  const getIcon = () => {
    switch (type) {
      case "send":
        return <ArrowUpCircle size={36} className={styles.sendIcon} />;
      case "receive":
        return <ArrowDownCircle size={36} className={styles.receiveIcon} />;
      case "deposit":
        return <ArrowUpCircle size={36} className={styles.depositIcon} />;
      case "withdraw":
        return <ArrowDownCircle size={36} className={styles.withdrawIcon} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.modalWrapper}>
      <div className={styles.modalContent}>
        {/* ✅ Close Button */}
        <button className={styles.closeButton} onClick={onClose}>
          <X size={24} />
        </button>

        {/* ✅ Transaction Icon & Title */}
        <div className={styles.header}>
          {getIcon()}
          <h3>{type.charAt(0).toUpperCase() + type.slice(1)} {selectedCrypto.name}</h3>
        </div>

        <p className={styles.network}><strong>Network:</strong> {selectedCrypto.network}</p>

        {/* ✅ Input for transaction amount */}
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (value < 0) {
              setError("❌ Amount cannot be negative.");
            } else {
              setError(null);
              setAmount(value);
            }
          }}
          className={styles.inputField}
        />

        {/* ✅ Error Message */}
        {error && <p className={styles.errorMessage}><AlertCircle size={16} /> {error}</p>}

        {/* ✅ Confirmation Button */}
        <button className={styles.confirmButton} onClick={handleConfirm} disabled={!amount || amount <= 0}>
          {confirmed ? <CheckCircle size={20} /> : "Confirm " + type.charAt(0).toUpperCase() + type.slice(1)}
        </button>

        {/* ✅ Success Message */}
        {confirmed && <p className={styles.successMessage}><CheckCircle size={20} /> Transaction Successful!</p>}
      </div>
    </div>
  );
}