"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar"; // ✅ Import Sidebar
import Header from "@/components/Header"; // ✅ Import Reusable Header Component
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState("");

  // ✅ Update date & time dynamically
  useEffect(() => {
    const updateDateTime = () => setCurrentDate(new Date().toLocaleString());
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);

  return (
    <div className={styles.dashboard}>
      {/* ✅ Reusable Header Component */}
      <Header />

      {/* ✅ Layout with Sidebar */}
      <div className={styles.container}>
        <Sidebar />
        
        {/* ✅ Placeholder for Main Content (Can be expanded later) */}
        <main className={styles.mainContent}>
          <h2>Dashboard Overview</h2>
          <p>Welcome to your secure portal.</p>
        </main>
      </div>
    </div>
  );
}