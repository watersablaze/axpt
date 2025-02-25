"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { FaTimes, FaInfoCircle } from "react-icons/fa"; // ✅ Corrected Import
import styles from "./Landing.module.css";

export default function LandingPage() {
  const [tagline, setTagline] = useState("The Future of Tech & Trade");
  const taglines = [
    "Empowering Global Connections",
    "Where Blockchain Meets Trade",
    "Decentralized Ecosystem"
  ];

  const [visibleLines, setVisibleLines] = useState<number>(0);
  const textLines = [
    "Welcome to Axis Point.",
  ];

  const [showInfoBox, setShowInfoBox] = useState(false);

  const toggleInfoBox = () => {
    setShowInfoBox((prev) => !prev);
    console.log("Info box state:", !showInfoBox);
  };

  useEffect(() => {
    let taglineIndex = 0;
    const taglineInterval = setInterval(() => {
      setTagline(taglines[taglineIndex]);
      taglineIndex = (taglineIndex + 1) % taglines.length;
    }, 4000);

    let textIndex = 0;
    const textInterval = setInterval(() => {
      setVisibleLines((prev) => (prev < textLines.length ? prev + 1 : prev));
      textIndex++;
      if (textIndex >= textLines.length) clearInterval(textInterval);
    }, 1500);

    return () => {
      clearInterval(taglineInterval);
      clearInterval(textInterval);
    };
  }, []);

  return (
    <main className={styles.landingContainer}>

      <div className={styles.circuitBoard}></div>
      <div className={styles.underwaterEffect}></div>
      <div className={styles.lightOverlay}></div>
      <div className={styles.scanningGrid}></div>

      <header className={styles.header}>
      <Image 
        src="/axpt.io-logo.png" 
        alt="AXPT Logo" 
        width={180} 
        height={80} 
        className={styles.logo}
        priority /* ✅ Speeds up logo loading */
      />
      <p className={styles.headerTagline}>
        Sign-up today for more information about <br /> eco-conscious investments and secure digital trade.
      </p>
      
      {/* ✅ Updated Form with Name/ID Fix */}
      <form className={styles.signupForm}>
      <input type="email" name="email" id="email" placeholder="Enter your email" required />
        <button type="submit" className={styles.signupButton}>Welcome Aboard</button>
      </form>
    </header>

      {/* 🎭 Hero Section */}
      <section className={styles.hero}>

        {/* 🎯 Sleek Toggle Button */}
        <motion.div 
          className={styles.toggleButton} 
          onClick={() => toggleInfoBox()}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaInfoCircle />
        </motion.div>

        {/* 📦 Compact Info Box (Popup Style) */}
        <AnimatePresence>
        {showInfoBox && (
          <motion.div 
            className={styles.infoBox}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className={styles.infoHeader}>
              <h3>🌍 Global. Private. Secure.</h3>
              <FaTimes className={styles.closeIcon} onClick={() => setShowInfoBox(false)} />
            </div>
            <p>Decentralized. Private. AI-powered. Future-ready.</p>
            <p>Seamless transactions. Borderless expansion.</p>
          </motion.div>
        )}
        </AnimatePresence>

        {/* ✅ Right-Side Text Section */}
        <div className={styles.rightSideText}>
          {textLines.slice(0, visibleLines).map((line, index) => (
            <motion.p key={index} className={styles.revealText}>
              {line}
            </motion.p>
          ))}
        </div>

        {/* ✅ Title */}
        <motion.h1 className={styles.title}>The cross roads of Tech, Trade, & Cultural Exchange.</motion.h1>

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

      </section>
    </main>
  );
}