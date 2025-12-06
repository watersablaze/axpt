"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

type StatusResponse = {
  online: boolean;
  viewerCount?: number;
};

export default function LivePage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 🔍 Poll stream status — now using SAME-ORIGIN route to avoid CORS
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/live/status", { cache: "no-store" });
        const data: StatusResponse = await res.json();

        setIsLive(data.online);
        setViewerCount(data.viewerCount ?? 0);
      } catch (e) {
        console.warn("Status check failed:", e);
        setIsLive(false);
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
    const interval = setInterval(checkStatus, 7000);
    return () => clearInterval(interval);
  }, []);

  // 🎥 Attach HLS video when live
  useEffect(() => {
    if (!isLive || !videoRef.current) return;

    import("hls.js").then((Hls) => {
      if (Hls.isSupported()) {
        const hls = new Hls.default();

        hls.loadSource("https://live.axpt.io/hls/0/stream.m3u8");
        hls.attachMedia(videoRef.current!);

        hls.on(Hls.Events.ERROR, (evt, data) => {
          console.error("HLS error:", data);
        });
      } else {
        // native fallback
        videoRef.current!.src = "https://live.axpt.io/hls/0/stream.m3u8";
      }
    });
  }, [isLive]);

  return (
    <main className={styles.pageRoot}>
      {/* 🌌 Nebula Background */}
      <div className={styles.nebulaLayer} />

      {/* ✨ Soft Gradient */}
      <div className={styles.gradientVeil} />

      {/* 🕯 Title */}
      <h1 className={styles.pageTitle}>AXPT • Nommo Transmission</h1>

      {/* 🔴 Status Bar */}
      <div className={styles.statusBar}>
        {isLive && (
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            <span>LIVE</span>
          </div>
        )}
        <div className={styles.viewerBadge}>👁 {viewerCount} watching</div>
      </div>

      {/* 🜁 Offline State */}
      {!isLive && !loading && (
        <div className={styles.frameWrapper}>
          <div className={styles.auraRing} />
          <div className={styles.ceremonyFrame}>
            <img
              src="/live/offline.png"
              alt="Transmission Offline"
              className={styles.offlineImage}
            />
          </div>
        </div>
      )}

      {/* 🜂 Live Player */}
      {isLive && (
        <div className={styles.frameWrapper}>
          <div className={styles.auraRing} />
          <div className={styles.ceremonyFrame}>
            <video
              ref={videoRef}
              className={styles.videoLive}
              controls
              autoPlay
              playsInline
              muted
            />
          </div>
        </div>
      )}

      <p className={styles.footerNote}>Streaming via AXPT Live Engine</p>
    </main>
  );
}