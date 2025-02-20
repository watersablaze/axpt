"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import AvatarUploader from "@/components/AvatarUploader"; // ✅ Ensure this is properly imported
import styles from "./DashboardHeader.module.css";

export default function DashboardHeader() {
  const { data: session, update } = useSession(); // ✅ Update session on avatar change
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      // ✅ If admin, use default admin avatar, otherwise use user avatar (or fallback)
      setUserAvatar(
        session.user.isAdmin 
          ? "/comet.admin.default.png"  // Admin default avatar
          : session.user.avatar || "/africanPro.jpg"  // Regular user avatar fallback
      );
    }
  }, [session]);

  return (
    <header className={styles.header}>
      {/* ✅ Platform Logo */}
      <div className={styles.logo}>
        <Image src="/AXI.png" alt="Platform Logo" width={100} height={50} priority />
      </div>

      {/* ✅ Admin & User Section */}
      <div className={styles.userSection}>
        {session?.user ? (
          <>
            {/* ✅ Correct Greeting Based on Role */}
            <span className={styles.greeting}>
              {session.user.isAdmin ? "Admin Dashboard" : `Hello, ${session.user.name}`}
            </span>

            {/* ✅ Dynamic Avatar Based on Role */}
            <Image
              src={userAvatar}
              alt="User Avatar"
              width={40}
              height={40}
              className={styles.avatar}
            />

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