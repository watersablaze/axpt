"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react"; // ✅ Import visibility toggle icons
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const user = session?.user;

  // ✅ Handle Wallet Address Copying
  const walletAddress = user?.walletAddress || "N/A";
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
        {collapsed ? "→" : "←"}
      </button>

      {/* Welcome Message */}
      {!collapsed && <h2 className={styles.welcomeMessage}>Welcome to your Dashboard!</h2>}

      {/* User Info */}
      {!collapsed && (
        <div className={styles.userInfo}>
          <h3 className={styles.name}>{user?.name || "User"}</h3>
          <p className={styles.email}>{user?.email}</p>
        </div>
      )}

      {/* ✅ Wallet Address Section */}
      {!collapsed && (
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
          <button className={styles.copyButton} onClick={copyToClipboard}>
            Copy Address
          </button>
        </div>
      )}

      {/* Profile Link */}
      {!collapsed && (
        <a href="/profile" className={styles.profileLink}>
          View Full Profile
        </a>
      )}
    </aside>
  );
}