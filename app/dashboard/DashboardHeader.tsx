"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import styles from "./DashboardHeader.module.css"; // ✅ Updated path

export default function DashboardHeader() {
  const { data: session } = useSession();

  return (
    <header className={styles.header}>
      {/* Left: Branding */}
      <div className={styles.logo}>
      <Image src="/AXI.png" alt="Platform Logo" width={120} height={40} />
      </div>

      {/* Center: Dashboard Navigation */}
      <nav className={styles.nav}>
        <Link href="/dashboard">Home</Link>
        <Link href="/wallet">Wallet</Link>
        <Link href="/transactions">Transactions</Link>
        <Link href="/settings">Settings</Link>
      </nav>

      {/* Right: User Info & Logout */}
      <div className={styles.userSection}>
        {session?.user ? (
          <>
            <span className={styles.greeting}>Hello, {session.user.name}!</span>
            <Image
              src="/africanPro.jpg"
              alt="User Avatar"
              width={40}
              height={40}
              className={styles.avatar}
            />
            <button className={styles.logoutBtn} onClick={() => signOut()}>
              Logout
            </button>
          </>
        ) : (
          <Link href="/login" className={styles.loginBtn}>Login</Link>
        )}
      </div>
    </header>
  );
}