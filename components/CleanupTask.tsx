"use client";

import { useEffect } from "react";

export default function CleanupTask() {
  useEffect(() => {
    const cleanupExpiredTokens = async () => {
      try {
        await fetch("/api/auth/cleanup", { method: "DELETE" });
        console.log("✅ Cleanup task executed successfully.");
      } catch (error) {
        console.error("❌ Failed to run cleanup task:", error);
      }
    };

    // ✅ Run cleanup every 30 minutes
    const interval = setInterval(cleanupExpiredTokens, 30 * 60 * 1000);
    
    // ✅ Run cleanup once on startup
    cleanupExpiredTokens();

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return null; // Hidden component, runs in the background
}