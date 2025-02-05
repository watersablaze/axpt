"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar"; // ✅ Import Sidebar
import Header from "../../components/Header"; // ✅ Import Reusable Header Component
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [ethAmount, setEthAmount] = useState(""); // ✅ Fixed missing ethAmount state
  const [stablecoinAmount, setStablecoinAmount] = useState("");

  // ✅ Function: Mint Stablecoins
  const mintStablecoin = async () => {
    if (!ethAmount) return alert("Enter ETH amount to mint.");
    const response = await fetch("/api/stablecoin/mint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userAddress: session?.user?.walletAddress, ethAmount }),
    });

    const data = await response.json();
    alert(data.message);
  };

  // ✅ Function: Redeem Stablecoins
  const redeemStablecoin = async () => {
    if (!stablecoinAmount) return alert("Enter stablecoin amount to redeem.");
    const response = await fetch("/api/stablecoin/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userAddress: session?.user?.walletAddress, stablecoinAmount }),
    });

    const data = await response.json();
    alert(data.message);
  };

  // ✅ Update date & time dynamically
  useEffect(() => {
    const updateDateTime = () => setCurrentDateTime(new Date().toLocaleString());
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);


  return (
    <div className={styles.dashboard}>
      <Header />

      <div className={styles.container}>
        <Sidebar />

        {/* ✅ Main Content */}
        <main className={styles.mainContent}>
          <h2>Dashboard Overview</h2>
          <p>Welcome to your secure portal.</p>

          {/* ✅ Display Date & Time */}
          <div className={styles.dateTimeContainer}>
            <h3>Current Date & Time</h3>
            <p>{currentDateTime}</p>
          </div>

          {/* ✅ Stablecoin Interaction */}
          <div className={styles.stablecoinSection}>
            <h3>Stablecoin Management</h3>

            {/* ✅ Mint Stablecoins */}
            <div className={styles.mintSection}>
              <h4>Mint Stablecoins</h4>
              <input
                type="text"
                placeholder="Enter ETH amount"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
                className={styles.inputField}
              />
              <button className={styles.mintButton} onClick={mintStablecoin}>
                Mint GLDUSD
              </button>
            </div>

            {/* ✅ Redeem Stablecoins */}
            <div className={styles.redeemSection}>
              <h4>Redeem Stablecoins</h4>
              <input
                type="text"
                placeholder="Enter GLDUSD amount"
                value={stablecoinAmount}
                onChange={(e) => setStablecoinAmount(e.target.value)}
                className={styles.inputField}
              />
              <button className={styles.redeemButton} onClick={redeemStablecoin}>
                Redeem for ETH
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}