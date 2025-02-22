"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import styles from "./Landing.module.css";

export default function LandingPage() {
  const [tagline, setTagline] = useState("The Future of Tech & Trade");
  const taglines = [
    "Empowering Global Connections",
    "Where Blockchain Meets Trade",
    "Decentralized Ecosystem"
  ];

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setTagline(taglines[index]);
      index = (index + 1) % taglines.length;
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className={styles.landingContainer}>

      <div className={styles.circuitBoard}></div>
      <div className={styles.underwaterEffect}></div>
      <div className={styles.lightOverlay}></div>

      <header className={styles.header}>
        <Image 
          src="/temporary.png" 
          alt="AXPT Logo" 
          width={180} 
          height={80} 
          className={styles.logo}
        />
        <p className={styles.headerTagline}>Join the Digital Revolution</p>
        <form className={styles.signupForm}>
          <input type="email" placeholder="Enter your email" required />
          <button type="submit" className={styles.signupButton}>Welcome Aboard</button>
        </form>
      </header>

      {/* 🎭 Hero Section */}
      <section className={styles.hero}>

        {/* ✅ Title */}
        <motion.h1 className={styles.title}>AXPT.IO</motion.h1>

        {/* ✅ Smart Contract */}
        <motion.div className={styles.smartContractContainer}>
          <motion.p className={`${styles.smartContractText} ${styles.contractBlurred}`}>
            <span className={styles.scrollingText}>
              <strong>📜 Smart Contract Execution</strong><br />
              ───────────────────────<br />
              <strong>🔹 Contract ID:</strong> 0x7B3A...C91D<br />
              <strong>🔹 Signer:</strong> Wallet 0xD3A9...<br />
              <strong>🔹 Network:</strong> Ethereum L2<br />
              <strong>🔹 Hash:</strong> 0xF3a91B3...987A<br />
              <br />
              <strong>🔄 Executing</strong> <span className={styles.progressDots}>. . .</span><br />
              ───────────────────────<br />
              <strong>📝 Smart Contract Code</strong><br />
              function approve(address spender, uint256 amount) {'{'}<br />
              &nbsp;&nbsp;uint256 _value = 100000;<br />
              {'}'}<br />
              <br />
              event Transfer(address indexed from, address indexed to, uint256 value);<br />
              ───────────────────────<br />
              <strong className={styles.pulsingText}>✅ Status: CONFIRMED</strong><br />
            </span>
          </motion.p>
          <motion.div className={styles.signature}>
            <span className={styles.signatureText}>Verified by AXPT Chain</span>
          </motion.div>
        </motion.div>

        {/* ✅ Tagline */}
        <motion.div className={styles.taglineWrapper}>
          <motion.p className={styles.tagline}>{tagline}</motion.p>
        </motion.div>

      </section>
    </main>
  );
}