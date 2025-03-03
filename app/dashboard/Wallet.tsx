"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Banknote, Bitcoin, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import styles from "./Wallet.module.css";

export default function Wallet() {
  const { data: session } = useSession();
  const [activeWallet, setActiveWallet] = useState<"crypto" | "fiat">("crypto");
  const [cryptoBalance, setCryptoBalance] = useState<number>(0);
  const [fiatBalance, setFiatBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function fetchCryptoBalance() {
      setLoading(true);
      setTimeout(() => {
        setCryptoBalance(2.5);
        setLoading(false);
      }, 1000);
    }
    fetchCryptoBalance();
  }, []);

  useEffect(() => {
    async function fetchFiatBalance() {
      setLoading(true);
      setTimeout(async () => {
        const response = await fetch("/api/stripe/balance");
        const data = await response.json();
        setFiatBalance(data.balance || 0);
        setLoading(false);
      }, 1000);
    }
    fetchFiatBalance();
  }, []);

  return (
    <div className={styles.walletWrapper} onClick={(e) => e.stopPropagation()}>
      <div className={styles.walletContainer}>
        <h2 className={styles.walletHeader}>Welcome, {session?.user?.name || "User"}!</h2>

        {/* ✅ Wallet Toggle Switch */}
        <div className={styles.walletToggle}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveWallet("crypto");
            }}
            className={activeWallet === "crypto" ? styles.active : ""}
          >
            <Bitcoin size={24} /> Crypto
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveWallet("fiat");
            }}
            className={activeWallet === "fiat" ? styles.active : ""}
          >
            <Banknote size={24} /> Fiat
          </button>
        </div>

        {/* ✅ Wallet Display */}
        <div className={styles.walletContent}>
          {loading ? (
            <div className={styles.loader}>Loading...</div>
          ) : activeWallet === "crypto" ? (
            <div className={styles.walletCard}>
              <h3>Crypto Wallet</h3>
              <p className={styles.balance}>
                Balance: <strong>{cryptoBalance} ETH</strong>
              </p>
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
              <p className={styles.balance}>
                Balance: <strong>${fiatBalance.toFixed(2)}</strong>
              </p>
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
    </div>
  );
}