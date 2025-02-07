"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { stablecoinContract } from "@/lib/ethers";

export default function Wallet() {
  const [balance, setBalance] = useState("0");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    async function fetchBalance() {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAddress(accounts[0]);
      const userBalance = await stablecoinContract.balanceOf(accounts[0]);
      setBalance(ethers.formatUnits(userBalance, 18));
    }
    fetchBalance();
  }, []);

  const sendTransaction = async () => {
    try {
      const tx = await stablecoinContract.transfer(address, ethers.parseUnits(amount, 18));
      await tx.wait();
      alert("Transaction Successful!");
    } catch (error) {
      console.error("Transaction Failed:", error);
    }
  };

  return (
    <div className="wallet-container">
      <h2>Blockchain Wallet</h2>
      <p>Address: {address}</p>
      <p>Balance: {balance} GLDUSD</p>

      <input
        type="text"
        placeholder="Recipient Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={sendTransaction}>Send Stablecoin</button>
    </div>
  );
}