"use client";

import { useState } from "react";
import styles from "./StablecoinManagement.module.css";

export default function MintStablecoin() {
  const [ethAmount, setEthAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleMint = async () => {
    if (!ethAmount || parseFloat(ethAmount) <= 0) {
      setMessage("Please enter a valid ETH amount.");
      return;
    }
    
    setLoading(true);
    setMessage("");
    
    try {
      // TODO: Integrate contract function for minting stablecoins
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate transaction delay
      setMessage(`Successfully minted stablecoins for ${ethAmount} ETH.`);
    } catch (error) {
      setMessage("Transaction failed. Please try again.");
    }
    
    setLoading(false);
    setEthAmount("");
  };

  return (
    <div className={styles.stablecoinContainer}>
      <h3 className={styles.title}>Mint Stablecoins</h3>
      <input
        type="number"
        placeholder="Enter ETH amount"
        value={ethAmount}
        onChange={(e) => setEthAmount(e.target.value)}
        className={styles.input}
      />
      <button className={styles.mintButton} onClick={handleMint} disabled={loading}>
        {loading ? "Minting..." : "Mint Stablecoin"}
      </button>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
