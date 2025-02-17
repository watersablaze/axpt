"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Eye, EyeOff, Copy, Menu } from "lucide-react"; // ✅ Sleek Icons
import styles from "./Sidebar.module.css";   

export default function Sidebar() {
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(true);
  const [showWallet, setShowWallet] = useState(false);
  const user = session?.user;

  // ✅ Ensure correct wallet address is displayed
  const walletAddress = session?.user?.walletAddress || "0xA1b2...3F4e";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress);
    alert("Wallet address copied!");
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.closed : ""}`}>
      {/* Toggle Button (Improved Styling) */}
      <button 
        className={styles.toggleButton} 
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Toggle Sidebar"
      >
        <Menu size={24} />
      </button>

      {/* Only Show Content When Expanded */}
      {!collapsed && (
        <div className={styles.content}>
          {/* ✅ Welcome Message */}
          <h2 className={styles.welcomeMessage}>Welcome!</h2>
          
          {/* ✅ User Info */}
          <div className={styles.userInfo}>
            <h3 className={styles.name}>{user?.name || "User"}</h3>
            <p className={styles.email}>{user?.email}</p>
          </div>

          {/* ✅ Wallet Address (Hidden in Collapsed Mode) */}
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
            <button className={styles.copyButton} onClick={copyToClipboard}>
              <Copy size={18} /> Copy
            </button>
          </div>

          {/* ✅ Navigation Links */}
          <nav className={styles.nav}>
            <a href="/profile">View Full Profile</a>
            <a href="/wallet">Wallet</a>
            <a href="/stablecoin">Stablecoin Management</a>
            <a href="/transactions">Transaction History</a>
            <a href="/settings">Settings</a>
          </nav>
        </div>
      )}
    </aside>
  );
}