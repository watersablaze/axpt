"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Eye, EyeOff, CopyCheck, Menu, X, Wallet2, DollarSign, ClipboardList, ScrollText, HelpCircle, User, Settings, BookOpen } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import styles from "./Sidebar.module.css";   

export default function Sidebar({ 
  collapsed, 
  setCollapsed, 
  setActiveSection 
}: { 
  collapsed: boolean; 
  setCollapsed: Dispatch<SetStateAction<boolean>>;
  setActiveSection: Dispatch<SetStateAction<string | null>>;
}) {  
  const { data: session } = useSession();
  const [showWallet, setShowWallet] = useState(false);
  const user = session?.user;
  const walletAddress = user?.walletAddress || "0xA1b2...3F4e";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress);
    alert("✅ Wallet address copied!");
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : styles.open}`}>
      {/* ✅ Toggle Sidebar Button */}
      <button 
        className={styles.toggleButton} 
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Toggle Sidebar"
      >
        {collapsed ? <Menu size={24} /> : <X size={24} />}
      </button>

      <div className={`${styles.content} ${collapsed ? styles.hidden : styles.visible}`}>
        {/* ✅ Welcome Message */}
        {session?.user && (
          <h2 className={styles.welcomeMessage}>
            Hello, <strong>{session.user.name}</strong> 👋
          </h2>
        )}

        {/* ✅ Wallet Section */}
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
            <CopyCheck size={16} /> Copy
          </button>
        </div>

        {/* ✅ Financial Dashboard - Moved Below Wallet Box */}
        <div className={styles.financialDashboard}>
          <h4>Financial Dashboard</h4>
          <button className={styles.navButton} onClick={() => setActiveSection("wallet")}>
            <Wallet2 size={24} /> Wallet
          </button>
          <button className={styles.navButton} onClick={() => setActiveSection("stablecoin")}>
            <DollarSign size={24} /> Stablecoin
          </button>
          <button className={styles.navButton} onClick={() => setActiveSection("transactions")}>
            <ClipboardList size={24} /> Transactions
          </button>
          <button className={styles.navButton} onClick={() => setActiveSection("bulletin")}>
            <ScrollText size={24} /> Bulletin
          </button>
        </div>

        {/* ✅ General Navigation - Below Financial Dashboard */}
        <nav className={styles.nav}>
          <h4>General</h4>
          <a href="/faq"><HelpCircle size={20} /> FAQ</a>
          <a href="/profile"><User size={20} /> Profile</a>
          <a href="/settings"><Settings size={20} /> Settings</a>
          <a href="/catalogue"><BookOpen size={20} /> Investor's Catalogue</a>
        </nav>
      </div>
    </aside>
  );
}