"use client";

import { useState } from "react";
import { ethers } from "ethers";

export default function WalletButton() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  async function connectWallet() {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        console.log("🔗 Connected wallet:", address);
      } catch (error) {
        console.error("❌ Wallet connection failed:", error);
      }
    } else {
      alert("⚠️ MetaMask is required to connect.");
    }
  }

  return (
    <div>
      <button onClick={connectWallet} className="bg-blue-500 text-white px-4 py-2 rounded">
        {walletAddress ? `Connected: ${walletAddress.slice(0, 6)}...` : "Connect MetaMask"}
      </button>
    </div>
  );
}