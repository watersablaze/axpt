"use client";

import { useState } from "react";
import styles from "./Wallet.module.css";
import { Eye, EyeOff, Copy } from "lucide-react";

export default function Wallet() {
  const [activeWallet, setActiveWallet] = useState("crypto"); // 'crypto' or 'fiat'
  const [showBalance, setShowBalance] = useState(false);
  const cryptoBalance = "2.453 ETH";
  const fiatBalance = "$5,230.00";
  const walletAddress = "0x1234...abcd";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress);
    alert("Wallet address copied!");
  };

  return (
    <div className={styles.walletContainer}>
      {/* Wallet Toggle */}
      <div className={styles.toggleContainer}>
        <button
          className={activeWallet === "crypto" ? styles.active : ""}
          onClick={() => setActiveWallet("crypto")}
        >
          Crypto Wallet
        </button>
        <button
          className={activeWallet === "fiat" ? styles.active : ""}
          onClick={() => setActiveWallet("fiat")}
        >
          Fiat Wallet
        </button>
      </div>

      {/* Wallet Display */}
      <div className={styles.walletBox}>
        <h3>{activeWallet === "crypto" ? "Crypto Balance" : "Fiat Balance"}</h3>
        <div className={styles.balanceDisplay}>
          {showBalance ? (
            <span>{activeWallet === "crypto" ? cryptoBalance : fiatBalance}</span>
          ) : (
            <span className={styles.hiddenText}>••••••••</span>
          )}
          <button
            className={styles.visibilityButton}
            onClick={() => setShowBalance(!showBalance)}
          >
            {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Wallet Address */}
      {activeWallet === "crypto" && (
        <div className={styles.walletAddressContainer}>
          <h4>Wallet Address</h4>
          <div className={styles.walletAddressBox}>
            <span>{walletAddress}</span>
            <button className={styles.copyButton} onClick={copyToClipboard}>
              <Copy size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
