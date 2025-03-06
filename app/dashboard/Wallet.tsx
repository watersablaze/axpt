"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Banknote, Bitcoin, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import TransactionModal from "./TransactionModal";
import styles from "./Wallet.module.css";

// ✅ Define supported cryptocurrencies & networks
const supportedCryptos = [
  { name: "Ethereum", symbol: "ETH", network: "Ethereum" },
  { name: "Bitcoin", symbol: "BTC", network: "Bitcoin" },
  { name: "Solana", symbol: "SOL", network: "Solana" },
  { name: "Binance Coin", symbol: "BNB", network: "Binance Smart Chain" }
];

export default function Wallet() {
  const { data: session } = useSession();
  const [activeWallet, setActiveWallet] = useState<"crypto" | "fiat">("crypto");
  const [selectedCrypto, setSelectedCrypto] = useState(supportedCryptos[0]);
  const [cryptoBalances, setCryptoBalances] = useState<{ [key: string]: number }>({
    ETH: 2.5,
    BTC: 0.1,
    SOL: 5.0,
    BNB: 3.2
  });
  const [fiatBalance, setFiatBalance] = useState<number>(1000);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<"send" | "receive" | "deposit" | "withdraw" | null>(null);

  // ✅ Auto-update balance when transactions occur
  const handleTransaction = (amount: number) => {
    if (modalType === "send") {
      if (cryptoBalances[selectedCrypto.symbol] >= amount) {
        setCryptoBalances(prev => ({
          ...prev,
          [selectedCrypto.symbol]: prev[selectedCrypto.symbol] - amount
        }));
      } else {
        alert("Insufficient balance!");
      }
    } else if (modalType === "receive") {
      setCryptoBalances(prev => ({
        ...prev,
        [selectedCrypto.symbol]: prev[selectedCrypto.symbol] + amount
      }));
    } else if (modalType === "deposit") {
      setFiatBalance(prev => prev + amount);
    } else if (modalType === "withdraw") {
      if (fiatBalance >= amount) {
        setFiatBalance(prev => prev - amount);
      } else {
        alert("Insufficient fiat balance!");
      }
    }
  };

  return (
    <div className={styles.walletContainer}>
      <h2 className={styles.walletHeader}>
        {session?.user?.name ? `Welcome, ${session.user.name}!` : "Welcome!"}
      </h2>

      {/* ✅ Wallet Type Toggle */}
      <div className={styles.walletToggle}>
        <button onClick={() => setActiveWallet("crypto")} className={activeWallet === "crypto" ? styles.active : ""}>
          <Bitcoin size={24} /> Crypto
        </button>
        <button onClick={() => setActiveWallet("fiat")} className={activeWallet === "fiat" ? styles.active : ""}>
          <Banknote size={24} /> Fiat
        </button>
      </div>

      {/* ✅ Cryptocurrency Selection */}
      {activeWallet === "crypto" && (
        <div className={styles.cryptoSelection}>
          {supportedCryptos.map(crypto => (
            <button
              key={crypto.symbol}
              className={selectedCrypto.symbol === crypto.symbol ? styles.activeCrypto : ""}
              onClick={() => setSelectedCrypto(crypto)}
            >
              {crypto.name} ({crypto.symbol})
            </button>
          ))}
        </div>
      )}

      {/* ✅ Wallet Display */}
      <div className={styles.walletContent}>
        {activeWallet === "crypto" ? (
          <div className={styles.walletCard}>
            <h3>{selectedCrypto.name} Wallet</h3>
            <p className={styles.balance}>
              Balance: <strong>{cryptoBalances[selectedCrypto.symbol] || 0} {selectedCrypto.symbol}</strong>
            </p>
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
        ) : (
          <div className={styles.walletCard}>
            <h3>Fiat Wallet</h3>
            <p className={styles.balance}>Balance: <strong>${fiatBalance.toFixed(2)}</strong></p>
            <div className={styles.actions}>
              <button onClick={() => { setModalOpen(true); setModalType("deposit"); }} className={styles.depositButton}>
                <ArrowUpCircle size={20} /> Deposit
              </button>
              <button onClick={() => { setModalOpen(true); setModalType("withdraw"); }} className={styles.withdrawButton}>
                <ArrowDownCircle size={20} /> Withdraw
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ✅ Transaction Modal */}
      {modalOpen && (
        <TransactionModal
          type={modalType}
          selectedCrypto={selectedCrypto}
          onClose={() => setModalOpen(false)}
          onTransaction={handleTransaction}
        />
      )}
    </div>
  );
}