"use client";

import { useEffect, useState } from "react";
import styles from "./dashboard.module.css";

export default function LiveAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/owncast/stats");
      const data = await res.json();
      setStats(data);
    } catch (e) {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.heading}>Live Stream Dashboard</h1>

      {loading && <p className={styles.dim}>Loading stream data…</p>}

      {stats && (
        <div className={styles.grid}>
          <StatusCard online={stats.online} />
          <ViewerCard count={stats.viewerCount} peak={stats.sessionPeakViewerCount} />
          <MetaCard title={stats.streamTitle} />
          <PreviewCard />
        </div>
      )}

      {!stats && !loading && (
        <p className={styles.error}>Unable to reach Owncast server.</p>
      )}
    </div>
  );
}

function StatusCard({ online }: { online: boolean }) {
  return (
    <div className="card">
      <h3>Status</h3>
      <p className={online ? "online" : "offline"}>
        {online ? "🟢 Live" : "🔴 Offline"}
      </p>
    </div>
  );
}

function ViewerCard({ count, peak }: { count: number; peak: number }) {
  return (
    <div className="card">
      <h3>Viewers</h3>
      <p>Current: {count}</p>
      <p>Peak: {peak}</p>
    </div>
  );
}

function MetaCard({ title }: { title: string }) {
  return (
    <div className="card">
      <h3>Stream Title</h3>
      <p>{title || "Untitled Stream"}</p>
    </div>
  );
}

function PreviewCard() {
  return (
    <div className="card large">
      <h3>Preview</h3>
      <video
        controls
        muted
        autoPlay
        src="https://live.axpt.io/hls/stream.m3u8"
        className="previewVideo"
      />
    </div>
  );
}