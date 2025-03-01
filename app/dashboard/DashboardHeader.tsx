"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import AvatarUploader from "../../components/AvatarUploader"; // ✅ Relative Import
import GoldPrice from "./GoldPrice"; // ✅ Import Gold Price Component
import styles from "./DashboardHeader.module.css";

export default function DashboardHeader() {
  const { data: session, update } = useSession(); // ✅ Update session on avatar change
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      // ✅ If admin, use default admin avatar, otherwise use user avatar (or fallback)
      setUserAvatar(
        session.user.isAdmin 
          ? "/comet.admin.default.png"
          : session.user.avatar && session.user.avatar !== "" 
            ? session.user.avatar 
            : "/africanPro.jpg"
      );
    }
  }, [session]);

  return (
    <header className={styles.header}>
      {/* ✅ Platform Logo */}
      <div className={styles.logo}>
        <Image src="/axpt-logo3.png" alt="Platform Logo" width={100} height={50} priority />
      </div>

    {/* ✅ Gold Price Positioned Next to Logo */}
    <div className={styles.goldPriceWrapper}>
      <GoldPrice />
    </div>


      {/* ✅ Title & Description Centered */}
      <div className={styles.headerContent}>
        <h2 className={styles.sectionTitle}>Finance Hub</h2>
        <p className={styles.sectionDescription}>Manage your assets seamlessly.</p>
      </div>


      {/* ✅ Admin & User Section */}
      <div className={styles.userSection}>
        {session?.user ? (
          <>
            <span className={styles.greeting}>
              {session.user.isAdmin ? "Admin Dashboard" : `Hello, ${session.user.name}`}
            </span>

            {/* ✅ Render Avatar only if valid */}
            {userAvatar && (
              <Image
                src={userAvatar}
                alt="User Avatar"
                width={40}
                height={40}
                className={styles.avatar}
                priority
              />
            )}

            {/* ✅ Avatar Upload Feature */}
            {!session.user.isAdmin && <AvatarUploader updateSession={update} />}

            {/* ✅ Logout Button */}
            <button className={styles.logoutBtn} onClick={() => signOut()}>Logout</button>
          </>
        ) : (
          <p>Login Required</p>
        )}
      </div>
    </header>
  );
}