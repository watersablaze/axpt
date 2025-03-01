"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Banknote, Bitcoin, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import styles from "./Wallet.module.css";

export default function Wallet() {
  const { data: session } = useSession();
  const [activeWallet, setActiveWallet] = useState<"crypto" | "fiat">("crypto");
  const [cryptoBalance, setCryptoBalance] = useState<number>(0);
  const [fiatBalance, setFiatBalance] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(false); // ✅ Controls wallet visibility

  // ✅ Fetch Crypto Balance (Mock for now, will use Web3 API)
  useEffect(() => {
    async function fetchCryptoBalance() {
      try {
        setCryptoBalance(2.5); // Mock balance: 2.5 ETH
      } catch (error) {
        console.error("❌ Error fetching crypto balance:", error);
      }
    }
    fetchCryptoBalance();
  }, []);

  // ✅ Fetch Fiat Balance (Using Stripe API)
  useEffect(() => {
    async function fetchFiatBalance() {
      try {
        const response = await fetch("/api/stripe/balance");
        const data = await response.json();
        setFiatBalance(data.balance || 0);
      } catch (error) {
        console.error("❌ Error fetching fiat balance:", error);
      }
    }
    fetchFiatBalance();
  }, []);

  return (
    <div className={`${styles.walletContainer} ${isVisible ? styles.visible : ""}`}>
      {/* ✅ Toggle Button for Wallet Visibility */}
      <button className={styles.toggleWallet} onClick={() => setIsVisible(!isVisible)}>
        {isVisible ? "Close Wallet" : "View Wallet"}
      </button>

      {/* ✅ Wallet Toggle Buttons */}
      <div className={styles.walletToggle}>
        <button
          onClick={() => setActiveWallet("crypto")}
          className={activeWallet === "crypto" ? styles.active : ""}
        >
          <Bitcoin size={24} /> Crypto
        </button>
        <button
          onClick={() => setActiveWallet("fiat")}
          className={activeWallet === "fiat" ? styles.active : ""}
        >
          <Banknote size={24} /> Fiat
        </button>
      </div>

      {/* ✅ Crypto Wallet View */}
      {activeWallet === "crypto" && (
        <div className={styles.walletDetails}>
          <h3>Crypto Wallet</h3>
          <p>Balance: <strong>{cryptoBalance} ETH</strong></p>
          <div className={styles.actions}>
            <button className={styles.sendButton}>
              <ArrowUpCircle size={20} /> Send
            </button>
            <button className={styles.receiveButton}>
              <ArrowDownCircle size={20} /> Receive
            </button>
          </div>
        </div>
      )}

      {/* ✅ Fiat Wallet View */}
      {activeWallet === "fiat" && (
        <div className={styles.walletDetails}>
          <h3>Fiat Wallet</h3>
          <p>Balance: <strong>${fiatBalance.toFixed(2)}</strong></p>
          <div className={styles.actions}>
            <button className={styles.depositButton}>
              <ArrowUpCircle size={20} /> Deposit
            </button>
            <button className={styles.withdrawButton}>
              <ArrowDownCircle size={20} /> Withdraw
            </button>
          </div>
        </div>
      )}
    </div>
  );
}