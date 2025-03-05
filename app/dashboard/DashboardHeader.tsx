"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import AvatarUploader from "../../components/AvatarUploader"; // ✅ Relative Import
import styles from "./DashboardHeader.module.css";

export default function DashboardHeader() {
  const { data: session, update } = useSession(); // ✅ Update session on avatar change
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState("");

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

    // ✅ Updates the current date and time
    useEffect(() => {
      const updateDateTime = () => {
        setCurrentDateTime(new Date().toLocaleString());
      };
  
      updateDateTime(); // Initial set
      const interval = setInterval(updateDateTime, 1000);
      return () => clearInterval(interval);
    }, []);

  return (
    <header className={styles.header}>
      {/* ✅ Platform Logo */}
      <div className={styles.logo}>
        <Image src="/axpt-logo3.png" alt="Platform Logo" width={100} height={50} priority />
      </div>

        {/* ✅ Current Date & Time (Replaces Gold Price) */}
        <div className={styles.dateTimeWrapper}>
        <p>{currentDateTime}</p>
      </div>

      {/* ✅ Title & Description Centered */}
      <div className={styles.headerContent}>
        <h2 className={styles.sectionTitle}>Financial Dashboard</h2>
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