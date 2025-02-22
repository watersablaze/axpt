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
    "The Next Era of Decentralized Finance",
    "Where Blockchain Meets Trade",
  ];

  // ✅ Parallax effect for scrolling
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 300], [0, -30]); // ✅ Subtle movement

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
      {/* 🌊 Underwater Light Effects */}
      <div className={styles.underwaterEffect}></div>
      <div className={styles.lightOverlay}></div>

      {/* 🔷 Transparent Header */}
      <header className={styles.header}>
        <Image src="/temp.axpt.png" alt="AXPT Logo" width={80} height={80} />
        <form className={styles.signupForm}>
          <input type="email" placeholder="Enter your email" required />
          <button type="submit" className={styles.signupButton}>Welcome Aboard</button>
        </form>
      </header>

      {/* 🎭 Hero Section with Smooth Animations */}
      <section className={styles.hero}>
        <motion.h1
          className={`${styles.title} fadeIn`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          AXPT.io
        </motion.h1>
        
        <motion.p
          className={`${styles.tagline} fadeIn`}
          key={tagline}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {tagline}
        </motion.p>

        {/* ✅ Subtle floating effect (not excessive) */}
        <motion.div style={{ y: parallaxY }} className={styles.ctaContainer}>
          <Link href="/signup" className={`${styles.ctaButton} fadeIn`}>
            Get Started
          </Link>
        </motion.div>
      </section>
    </main>
  );
}