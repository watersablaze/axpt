import { useEffect, useState } from "react";

export function useStreamStatus() {
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(0);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("https://live.axpt.io/api/status");
        const data = await res.json();
        setIsLive(data.online);
        setViewers(data.viewerCount || 0);
      } catch (err) {
        console.error("Stream status error:", err);
      }
    };

    fetchStatus();

    // check every 10 seconds
    const interval = setInterval(fetchStatus, 10_000);
    return () => clearInterval(interval);
  }, []);

  return { isLive, viewers };
}