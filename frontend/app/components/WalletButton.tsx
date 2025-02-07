"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getStablecoinContract } from "../lib/stablecoin";

export default function WalletButton() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  async function connectWallet() {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
      console.log("Connected wallet:", address);
    } else {
      alert("MetaMask is required to connect.");
    }
  }

  async function mintStablecoin() {
    if (!walletAddress) return alert("Please connect your wallet first!");

    try {
      const contract = getStablecoinContract();
      const tx = await contract.mintStablecoin({ value: ethers.parseEther("0.1") });
      await tx.wait();
      alert("✅ Stablecoin Minted!");
    } catch (error) {
      console.error("Minting failed:", error);
    }
  }

  return (
    <div>
      <button onClick={connectWallet} className="bg-blue-500 text-white px-4 py-2 rounded">
        {walletAddress ? `Connected: ${walletAddress.slice(0, 6)}...` : "Connect MetaMask"}
      </button>

      {walletAddress && (
        <button onClick={mintStablecoin} className="bg-green-500 text-white px-4 py-2 rounded ml-2">
          Mint Stablecoin
        </button>
      )}
    </div>
  );
}