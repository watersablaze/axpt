"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import Wallet from "./Wallet";
import TransactionHistory from "./TransactionHistory";
import MintStablecoin from "./MintStablecoin";
import Stablecoin from "./Stablecoin"; // ✅ Ensure correct import
import BulletinBoard from "./BulletinBoard";
import Overlay from "./Overlay"; // ✅ Replaces Modal with full HUD Overlay
import styles // 🚫 Stale import (auto-commented): from "@/app/dashboard/Dashboard.module.css";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeHUD, setActiveHUD] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [walletActive, setWalletActive] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const openHUD = useCallback((component: string) => {
    setActiveHUD(component);
    setWalletActive(component === "wallet"); // Sync wallet state
  }, []);

  const closeHUD = useCallback(() => {
    setActiveHUD(null);
    setWalletActive(false);
  }, []);

  return (
    <div className={`${/* styles.dashboard 🚫 stale */} ${activeHUD ? styles.dimmed : ""}`}>
      <DashboardHeader />
      <div className={/* styles.dashboard 🚫 stale */Content}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} openHUD={openHUD} />

        {/* ✅ Overlay for HUD Components */}
        <Overlay isOpen={!!activeHUD} closeHUD={closeHUD}>
          {activeHUD === "wallet" && <Wallet closeHUD={closeHUD} setWalletActive={setWalletActive} />}
          {activeHUD === "stablecoin" && <Stablecoin closeHUD={closeHUD} />}
          {activeHUD === "transactions" && <TransactionHistory closeHUD={closeHUD} />}          
          {activeHUD === "bulletin" && <BulletinBoard closeHUD={closeHUD} />}        
          </Overlay>
      </div>
    </div>
  );
}