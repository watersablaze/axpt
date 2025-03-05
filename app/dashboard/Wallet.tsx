"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Banknote, Bitcoin, ArrowDownCircle, ArrowUpCircle, RefreshCw } from "lucide-react";
import styles from "./Wallet.module.css";

export default function Wallet() {
  const { data: session } = useSession();
  const [activeWallet, setActiveWallet] = useState<"crypto" | "fiat">("crypto");
  const [cryptoBalance, setCryptoBalance] = useState<number>(0);
  const [fiatBalance, setFiatBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // ✅ Fetch Mock Crypto Balance
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setCryptoBalance(2.5); // Mock Data
      setLoading(false);
    }, 1000);
  }, []);

  // ✅ Fetch Mock Fiat Balance
  useEffect(() => {
    setLoading(true);
    setTimeout(async () => {
      const response = await fetch("/api/stripe/balance");
      const data = await response.json();
      setFiatBalance(data.balance || 0);
      setLoading(false);
    }, 1000);
  }, []);

  // ✅ Refresh Balances
  const refreshBalances = () => {
    setRefreshing(true);
    setLoading(true);
    setTimeout(() => {
      setCryptoBalance(2.75); // Mock Refresh Update
      setFiatBalance((prev) => prev + 100); // Mock Fiat Update
      setLoading(false);
      setRefreshing(false);
    }, 1000);
  };

  return (
    <div className={styles.walletContainer}>
      <h2 className={styles.walletHeader}>
        {session?.user?.name ? `Welcome, ${session.user.name}!` : "Welcome!"}
      </h2>

      {/* ✅ Wallet Type Toggle */}
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

      {/* ✅ Refresh Button */}
      <div className={styles.refreshWrapper}>
        <button className={styles.refreshButton} onClick={refreshBalances} disabled={refreshing}>
          <RefreshCw size={20} className={refreshing ? styles.rotating : ""} /> {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ✅ Wallet Display */}
      <div className={styles.walletContent}>
        {loading ? (
          <div className={styles.loader}>Fetching latest balance...</div>
        ) : activeWallet === "crypto" ? (
          <div className={styles.walletCard}>
            <h3>Crypto Wallet</h3>
            <p className={styles.balance}>Balance: <strong>{cryptoBalance} ETH</strong></p>
            <div className={styles.actions}>
              <button className={styles.sendButton}>
                <ArrowUpCircle size={20} /> Send
              </button>
              <button className={styles.receiveButton}>
                <ArrowDownCircle size={20} /> Receive
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.walletCard}>
            <h3>Fiat Wallet</h3>
            <p className={styles.balance}>Balance: <strong>${fiatBalance.toFixed(2)}</strong></p>
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
    </div>
  );
}