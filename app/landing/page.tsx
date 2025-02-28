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

            {/* ✅ Header Section */}
            <header className={styles.header}>
                <Image 
                    src="/axpt-logo3.png" 
                    alt="AXPT Logo" 
                    width={150} 
                    height={60} 
                    className={styles.logo}
                    priority
                />
                <motion.h1 className={styles.title}>
                 Tech, Trade, & Cultural Exchange.
                </motion.h1>
                <motion.div className={styles.securityLock}>🔒</motion.div>
            </header>

            {/* ✅ Hero Section */}
            <section className={styles.hero}>
                <div className={styles.centerSection}>
                    
                    {/* ✅ Top Text - Inscription Style */}
                    <motion.div 
                        className={styles.topTextContainer}
                        initial={{ opacity: 0, filter: "blur(10px)" }}
                        animate={{ opacity: 1, filter: "blur(0px)" }}
                        transition={{ duration: 1, delay: 0.5 }}
                    >
                        <p className={styles.inscriptionText}>Welcome to AXPT.</p>
                    </motion.div>

                    {/* ✅ Smart Contract - Smaller, Floating, Animated */}
                    <motion.div 
                        className={styles.smartContractContainer}
                        initial={{ opacity: 0, filter: "blur(10px)" }}
                        animate={{ opacity: 1, filter: "blur(2px)" }}
                        transition={{ duration: 1, delay: 1 }}
                    >
                        <p className={styles.smartContractText}>
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
                        </p>
                    </motion.div>

                                            {/* ✅ Bottom Text */}
                        {/* ✅ Bottom Text - Now Fully Adjustable */}
                        <div className={styles.bottomSection}>
                            {/* ✅ Blockchain Powered - Small & Snug */}
                            <motion.p className={styles.blockchainInscription}
                                initial={{ opacity: 0, filter: "blur(10px)" }}
                                animate={{ opacity: 1, filter: "blur(0px)" }}
                                transition={{ duration: 1, delay: 1.5 }}
                            >
                                Blockchain Powered
                            </motion.p>

                            {/* ✅ Connect With Us - Independent */}
                            <motion.p className={styles.connectText}
                                initial={{ opacity: 0, filter: "blur(10px)" }}
                                animate={{ opacity: 1, filter: "blur(0px)" }}
                                transition={{ duration: 1, delay: 1.8 }}
                            >
                                Connect with us:
                            </motion.p>

                            {/* ✅ Email Section - Independent */}
                            <motion.div className={styles.emailContainer}
                                initial={{ opacity: 0, filter: "blur(10px)" }}
                                animate={{ opacity: 1, filter: "blur(0px)" }}
                                transition={{ duration: 1, delay: 2.1 }}
                            >
                                <svg className={styles.emailIcon} viewBox="0 0 24 24">
                                    <path d="M2 6c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6zm2 0l8 5 8-5H4zm0 12h16V8l-8 5-8-5v10z"/>
                                </svg>
                                <span className={styles.emailText}>connect@axpt.io</span>
                            </motion.div>
                        </div>
                </div>

                {/* ✅ Side Icons */}
                <motion.div className={styles.leftIcon}>
                    <svg width="50" height="50" viewBox="0 0 24 24" className={styles.blockchainIcon}>
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                        <path d="M7 7 L14 7 M7 17 L14 17 M7 7 L7 17 M17 7 L17 17" />
                    </svg>
                </motion.div>
                
                <motion.div className={styles.rightIcon}>
                    <svg width="50" height="50" viewBox="0 0 24 24" className={styles.shieldIcon}>
                        <path d="M12 2L4 5v6c0 5 4 9 8 11 4-2 8-6 8-11V5l-8-3z"/>
                    </svg>
                </motion.div>

                {/* ✅ Footer Section */}
                <footer className={styles.footer}>
                    <span className={styles.footerText}>© 2025 AXPT</span>
                    <span className={styles.footerSeparator}>|</span>
                    <span className={styles.footerText}>All Rights Reserved</span>
                </footer>

            </section>
        </main>
    );
}