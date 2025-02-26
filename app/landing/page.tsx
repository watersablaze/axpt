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

        <motion.div className={styles.securityLock}>
           🔒
          </motion.div>
      </header>

      {/* ✅ Hero Section */}
      <section className={styles.hero}>

{/* ✅ Left-Side Key Phrases */}
<div className={styles.leftSideText}>
  <motion.p 
    className={styles.fadeInText}
    initial={{ opacity: 0, filter: "blur(10px)" }}
    animate={{ opacity: 1, filter: "blur(0px)" }}
    transition={{ duration: 1, delay: 0.5 }}
  >
    Blockchain Powered.
  </motion.p>

  <motion.p 
    className={styles.fadeInText}
    initial={{ opacity: 0, filter: "blur(10px)" }}
    animate={{ opacity: 1, filter: "blur(0px)" }}
    transition={{ duration: 1, delay: 1.2 }}
  >
    Secured. Verified. Connected.
  </motion.p>

  {/* ✅ Animated Blockchain Icon */}
  <motion.div 
    className={styles.blockchainAnimation}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 1.5, delay: 2, repeat: Infinity, repeatType: "reverse" }}
  >
    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.blockchainIcon}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M7 7 L14 7 M7 17 L14 17 M7 7 L7 17 M17 7 L17 17" />
    </svg>
  </motion.div>
</div>

        {/* ✅ Right-Side Text Section */}
        <div className={styles.rightSideText}>
          <motion.p className={styles.revealText}>Welcome to AXPT.</motion.p>
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

      {/* ✅ Footer Section - Inline Text with Adjustable Spacing */}
      <footer className={styles.footer}>
      <span className={styles.footerText}>2025</span>
        <span className={styles.footerText}>|</span>
        <span className={styles.footerText}>axpt.io</span>
        <span className={styles.footerText}>|</span>
        <span className={styles.footerText}>All Rights Reserved.</span>
      </footer>
    </main>
  );
}