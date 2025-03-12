"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import Wallet from "./Wallet";
import TransactionHistory from "./TransactionHistory";
import MintStablecoin from "./MintStablecoin";
import RedeemStablecoin from "./Stablecoin";
import BulletinBoard from "./BulletinBoard";
import Overlay from "./Overlay"; // ✅ Replaces Modal with full HUD Overlay
import styles from "@/app/dashboard/Dashboard.module.css";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeHUD, setActiveHUD] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [walletActive, setWalletActive] = useState(false);

  // ✅ Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // ✅ Open the HUD for a specific component
  const openHUD = useCallback((component: string) => {
    setActiveHUD(component);
    setWalletActive(component === "wallet"); // Ensure wallet state syncs correctly
  }, []);

  // ✅ Close the HUD
  const closeHUD = useCallback(() => {
    setActiveHUD(null);
    setWalletActive(false);
  }, []);

  return (
    <div className={`${styles.dashboard} ${activeHUD ? styles.dimmed : ""}`}>
      <DashboardHeader />
      <div className={styles.dashboardContent}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} openHUD={openHUD} />

        {/* ✅ Overlay for HUD Components */}
        <Overlay isOpen={!!activeHUD} closeHUD={closeHUD}>
          {activeHUD === "wallet" && <Wallet setWalletActive={setWalletActive} />}
          {activeHUD === "stablecoin" && (
            <>
              <MintStablecoin />
              <RedeemStablecoin />
            </>
          )}
          {activeHUD === "transactions" && <TransactionHistory />}
          {activeHUD === "bulletin" && <BulletinBoard />}
        </Overlay>
      </div>
    </div>
  );
}