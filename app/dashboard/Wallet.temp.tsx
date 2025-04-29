"use client";

import { useState, useEffect } from "react";
import { Banknote, Bitcoin, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { toast } from "sonner";
import styles from "./Wallet.module.css";
import TransactionModal from "./TransactionModal";

const supportedCryptos = [
  { name: "Ethereum", symbol: "ETH", network: "Ethereum" },
  { name: "Bitcoin", symbol: "BTC", network: "Bitcoin" },
  { name: "Solana", symbol: "SOL", network: "Solana" },
  { name: "Binance Coin", symbol: "BNB", network: "Binance Smart Chain" }
];

interface WalletProps {
  closeHUD: () => void;
  setWalletActive: (state: boolean) => void;
}

export default function Wallet({ closeHUD, setWalletActive }: WalletProps) {
  const [activeWallet, setActiveWallet] = useState("crypto");
  const [selectedCrypto, setSelectedCrypto] = useState(supportedCryptos[0]);
  const [cryptoBalances, setCryptoBalances] = useState<{ [key: string]: number }>({});
  const [fiatBalance, setFiatBalance] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"send" | "receive" | "deposit" | "withdraw" | null>(null);

  useEffect(() => {
    document.body.classList.add("hud-active");
    setWalletActive(true);
    return () => {
      document.body.classList.remove("hud-active");
      setWalletActive(false);
    };
  }, [setWalletActive]);

  // ✅ Fetch balances from API
  const fetchBalances = async () => {
    try {
      console.log("Fetching balances...");
      const response = await fetch("/api/wallet/balances");
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setCryptoBalances(data.balances.cryptoBalances);
      setFiatBalance(data.balances.fiatBalance);
      setLastUpdated(new Date().toLocaleTimeString());

      toast.success("✅ Balances updated successfully!");
    } catch (error) {
      console.error("❌ Failed to fetch balances:", error);
      toast.error("❌ Failed to update balances");
    }
  };

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.walletContainer}>
      <h2 className={styles.walletTitle}>Wallet Overview</h2>

      {/* ✅ Balance Section */}
      <div className={styles.balanceSection}>
        <h3 className={styles.balanceLabel}>Balance:</h3>
        <p className={styles.balance}>
          <strong>
            {cryptoBalances[selectedCrypto.symbol] !== undefined
              ? cryptoBalances[selectedCrypto.symbol].toFixed(4)
              : "Loading..."}{" "}
            {selectedCrypto.symbol}
          </strong>
        </p>
      </div>

      {/* ✅ Last Updated */}
      <p className={styles.lastUpdated}>🕒 Last Updated: {lastUpdated || "Fetching..."}</p>

      {/* ✅ Wallet Toggle */}
      <div className={styles.walletToggle}>
        <button
          onClick={() => setActiveWallet("crypto")}
          className={`${styles.cryptoButton} ${activeWallet === "crypto" ? styles.active : ""}`}
        >
          <Bitcoin size={24} /> Crypto
        </button>
        <button
          onClick={() => setActiveWallet("fiat")}
          className={`${styles.fiatButton} ${activeWallet === "fiat" ? styles.active : ""}`}
        >
          <Banknote size={24} /> Fiat
        </button>
      </div>

      {/* ✅ Wallet Content */}
      <div className={styles.walletContent}>
        <div className={styles.walletCard}>
          <p className={styles.network}><strong>Network:</strong> {selectedCrypto.network}</p>
          <div className={styles.actions}>
            <button onClick={() => { setModalOpen(true); setModalType("send"); }} className={styles.sendButton}>
              <ArrowUpCircle size={20} /> Send
            </button>
            <button onClick={() => { setModalOpen(true); setModalType("receive"); }} className={styles.receiveButton}>
              <ArrowDownCircle size={20} /> Receive
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Transaction Modal */}
      {modalOpen && modalType && (
        <TransactionModal
          type={modalType}
          selectedCrypto={selectedCrypto}
          onClose={() => setModalOpen(false)}
          onTransaction={fetchBalances}
        />
      )}
    </div>
  );
}