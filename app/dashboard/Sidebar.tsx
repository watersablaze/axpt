"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Eye, EyeOff, Menu, User, Wallet, Settings, List } from "lucide-react"; 
import styles from "./Sidebar.module.css";   

export default function Sidebar() {
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(true);
  const [showWallet, setShowWallet] = useState(false);
  const user = session?.user;

  const walletAddress = session?.user?.walletAddress || "N/A";

  const copyToClipboard = () => {
    if (walletAddress !== "N/A") {
      navigator.clipboard.writeText(walletAddress);
      alert("Wallet address copied!");
    }
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.closed : ""}`}>
      {/* Sidebar Toggle Button */}
      <button className={styles.toggleButton} onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? <Menu size={18} /> : "←"}
      </button>

      {/* Welcome Message */}
      {!collapsed && <h2 className={styles.welcomeMessage}>Welcome!</h2>}

      {/* User Info */}
      {!collapsed && (
        <div className={styles.userInfo}>
          <h3 className={styles.name}>{user?.name || "User"}</h3>
          <p className={styles.email}>{user?.email}</p>
        </div>
      )}

      {/* ✅ Navigation Links */}
      <nav className={styles.nav}>
        <div className={styles.navItem}>
          <User className={styles.navIcon} />
          {!collapsed && <span className={styles.navText}>View Profile</span>}
        </div>

        <div className={styles.navItem}>
          <Wallet className={styles.navIcon} />
          {!collapsed && <span className={styles.navText}>Wallet</span>}
        </div>

        <div className={styles.navItem}>
          <List className={styles.navIcon} />
          {!collapsed && <span className={styles.navText}>Transaction History</span>}
        </div>

        <div className={styles.navItem}>
          <Settings className={styles.navIcon} />
          {!collapsed && <span className={styles.navText}>Settings</span>}
        </div>
      </nav>

      {/* ✅ Wallet Address Section */}
      <div className={styles.walletSection}>
        <h4>Wallet Address:</h4>
        <div className={styles.walletBox}>
          {showWallet ? (
            <span>{walletAddress}</span>
          ) : (
            <span className={styles.hiddenText}>•••••••••••••••••••••••••••</span>
          )}
          <button
            className={styles.visibilityButton}
            onClick={() => setShowWallet(!showWallet)}
            aria-label="Toggle wallet visibility"
          >
            {showWallet ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <button className={styles.copyButton} onClick={copyToClipboard}>Copy</button>
      </div>
    </aside>
  );
}