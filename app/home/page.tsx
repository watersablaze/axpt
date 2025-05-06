// app/home/page.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import styles from './HomePage.module.css';
{/* import OrbAnimation from "@/components/OrbAnimation"; */}

export default function HomePage() {
  return (
    <motion.main
      className={styles.pageContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      {/* Orb / Compass Core */}
      <div className={styles.orbCenterpiece}>
       {/* <OrbAnimation fadeIn size={220} /> */}
      </div>

      {/* Constellation Nav Links */}
      <nav className={styles.constellationNav}>
        <Link href="/whitepaper" className={styles.navLink}>Whitepaper</Link>
        <Link href="/wallet" className={styles.navLink}>Wallet Core</Link>
        <Link href="/mission" className={styles.navLink}>Mission</Link>
        <Link href="/ecosystem" className={styles.navLink}>Ecosystem</Link>
        <Link href="/partners" className={styles.navLink}>Partner Access</Link>
      </nav>

      {/* Tagline or Welcome */}
      <h1 className={styles.tagline}>A New Axis of Exchange Has Emerged</h1>
    </motion.main>
  );
}
