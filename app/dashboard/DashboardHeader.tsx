"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import styles from "./DashboardHeader.module.css";

export default function DashboardHeader() {
  const { data: session } = useSession();
  const [factIndex, setFactIndex] = useState(0);
  const [glitch, setGlitch] = useState(false);

  // ✅ Investment insights list
  const investmentFacts = [
    "Gold has been a store of value for over 3,000 years.",
    "Stablecoins provide liquidity without the volatility of traditional cryptocurrencies.",
    "Investing in precious metals helps hedge against inflation.",
    "Blockchain is revolutionizing asset-backed securities and investments.",
    "Digital wallets ensure secure and seamless asset transactions.",
  ];

  // ✅ Handle text transition with glitch effect
  useEffect(() => {
    setGlitch(true);
    const timer = setTimeout(() => {
      setGlitch(false);
      setTimeout(() => {
        setFactIndex((prev) => (prev + 1) % investmentFacts.length);
        setGlitch(true);
      }, 500);
    }, 10000);
    return () => clearTimeout(timer);
  }, [factIndex]);

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Image 
          src="/AXI.png" 
          alt="Platform Logo" 
          width={100} 
          height={50} 
          priority // ✅ Prioritizes loading
        />
      </div>

      {/* ✅ Dynamic Investment Insights */}
      <div className={`${styles.infoDisplay} ${glitch ? styles.glitch : ""}`}>
        <p>{investmentFacts[factIndex]}</p>
      </div>

      {/* ✅ User Info & Logout */}
      <div className={styles.userSection}>
        {session?.user ? (
          <>
            <span className={styles.greeting}>Hello, {session.user.name}</span>
            <Image src="/africanPro.jpg" alt="User Avatar" width={40} height={40} className={styles.avatar} />
            <button className={styles.logoutBtn} onClick={() => signOut()}>Logout</button>
          </>
        ) : (
          <p>Login Required</p>
        )}
      </div>
    </header>
  );
}