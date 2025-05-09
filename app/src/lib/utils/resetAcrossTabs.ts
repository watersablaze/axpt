// resetAcrossTabs.ts
// 🔄 Utility to force-sync state across all browser tabs using BroadcastChannel

export const resetAcrossTabs = () => {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
  
    const channel = new BroadcastChannel("axpt-storage");
    channel.postMessage({ type: "forceReset" });
    channel.close();
  };