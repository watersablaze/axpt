"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image"; // ✅ Use Next.js Image for optimization
import styles from "./Header.module.css";

const Header = () => {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>
        AXIS P
        <Image
          src="/AXI.png"
          alt="Axis Point Logo"
          width={50}
          height={50}
          priority // ✅ Optimized for faster loading
          className={styles.logoO}
        />
        INT
      </h1>

      <p className={styles.tagline}>
        <strong>The Crossroads of Technology, Trade, and Cultural Exchange.</strong>
      </p>

      <div className={styles.buttonContainer}>
        <Link href="/login" className={styles.loginButton}>
          Login
        </Link>
      </div>
    </header>
  );
};

export default Header;