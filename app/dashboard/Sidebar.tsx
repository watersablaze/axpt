"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Eye, EyeOff, CopyCheck, Menu } from "lucide-react"; // ✅ Sleeker Copy Icon
import styles from "./Sidebar.module.css";   

export default function Sidebar() {
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(true);
  const [showWallet, setShowWallet] = useState(false);
  const user = session?.user;

  // ✅ Ensure correct wallet address is displayed
  const walletAddress = user?.walletAddress || "0xA1b2...3F4e";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress);
    alert("✅ Wallet address copied!");
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.closed : ""}`}>
      {/* ✅ Toggle Button */}
      <button 
        className={styles.toggleButton} 
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Toggle Sidebar"
      >
        <Menu size={24} />
      </button>

      {/* ✅ Sidebar Content */}
      <div className={`${styles.content} ${collapsed ? styles.hidden : styles.visible}`}>
        {/* ✅ Welcome Message */}
        <h2 className={styles.welcomeMessage}>Welcome!</h2>

        {/* ✅ User Info */}
        <div className={styles.userInfo}>
          <h3 className={styles.name}>{user?.name || "User"}</h3>
          <p className={styles.email}>{user?.email}</p>
        </div>

        {/* ✅ Wallet Address */}
        <div className={styles.walletSection}>
          <h4>Wallet Address:</h4>
          <div className={styles.walletBox}>
            {showWallet ? <span>{walletAddress}</span> : <span className={styles.hiddenText}>•••••••••••••••••••</span>}
            <button 
              className={styles.visibilityButton} 
              onClick={() => setShowWallet(!showWallet)}
              aria-label="Toggle wallet visibility"
            >
              {showWallet ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* ✅ Sleeker Copy Button with Extra Spacing */}
          <button className={styles.copyButton} onClick={copyToClipboard}>
            <CopyCheck size={16} /> Copy
          </button>
        </div>

        {/* ✅ Divider for Navigation Links */}
        <div className={styles.navDivider}></div> 

        {/* ✅ Navigation Links (Now Golden) */}
        <nav className={styles.nav}>
          <a href="/profile">View Full Profile</a>
          <a href="/wallet">Wallet</a>
          <a href="/stablecoin">Stablecoin Management</a>
          <a href="/transactions">Transaction History</a>
          <a href="/settings">Settings</a>
        </nav>
      </div>
    </aside>
  );
}