"use client";

import Image from "next/image";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <Image src="/AXI.png" alt="AXPT Logo" width={100} height={50} priority />
        <h1>The Future of Tech & Trade</h1>
        <p>Empowering global connections with decentralized finance and cultural exchange.</p>
        <a href="/login" className={styles.ctaButton}>Join Now</a>
      </div>
    </section>
  );
}