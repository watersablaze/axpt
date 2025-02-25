"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import styles from "./Landing.module.css";

export default function LandingPage() {
  return (
    <main className={styles.landingContainer}>
      <div className={styles.underwaterEffect}></div>
      <div className={styles.lightOverlay}></div>
      <div className={styles.scanningGrid}></div>

      {/* ✅ Header Section with Logo & Centered Title */}
      <header className={styles.header}>
        <Image 
          src="/axpt-logo2.png" 
          alt="AXPT Logo" 
          width={180} 
          height={80} 
          className={styles.logo}
          priority
        />
        <motion.h1 className={styles.title}>
          The Crossroads of Tech, Trade, & Cultural Exchange.
        </motion.h1>
      </header>

      {/* ✅ Hero Section */}
      <section className={styles.hero}>
        {/* ✅ Right-Side Text Section */}
        <div className={styles.rightSideText}>
          <motion.p className={styles.revealText}>Welcome to axpt.</motion.p>
          <motion.p className={styles.revealText}>
            Connect with us below: <br />
            <span className={styles.emailText}>📧 connect@axpt.io</span>
          </motion.p>
        </div>

        {/* ✅ Smart Contract Animation */}
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
      </section>
    </main>
  );
}
