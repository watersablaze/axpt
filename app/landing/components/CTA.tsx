"use client";

import styles from "./CTA.module.css";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section className={styles.ctaSection}>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        Ready to Join?
      </motion.h2>
      <p>Start your journey today with AXPT and experience the future of tech and trade.</p>
      
      <motion.div
        className={styles.buttonContainer}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <Link href="/signup" className={styles.ctaButton}>
          Get Started
        </Link>
      </motion.div>
    </section>
  );
}