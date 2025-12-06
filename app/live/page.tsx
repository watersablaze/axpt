"use client";

import { useEffect, useRef, useState } from "react";

type StatusResponse = {
  online: boolean;
  viewerCount: number;
};

export default function LivePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 🔍 Poll stream status
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("https://live.axpt.io/api/status");
        const data: StatusResponse = await res.json();

        setIsLive(data.online);
        setViewerCount(data.viewerCount ?? 0);
      } catch (err) {
        console.error("Status fetch failed:", err);
        setIsLive(false);
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
    const interval = setInterval(checkStatus, 7000);
    return () => clearInterval(interval);
  }, []);

  // 🎥 Attach HLS when live
  useEffect(() => {
    if (!isLive || !videoRef.current) return;

    import("hls.js").then((Hls) => {
      if (Hls.isSupported()) {
        const hls = new Hls.default();
        hls.loadSource("https://live.axpt.io/hls/stream.m3u8");
        hls.attachMedia(videoRef.current!);
      } else {
        videoRef.current!.src = "https://live.axpt.io/hls/stream.m3u8";
      }
    });
  }, [isLive]);

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-start py-10 px-4 bg-black text-white relative">
      {/* 🌌 Title */}
      <h1 className="text-3xl font-light tracking-wide mb-6 opacity-80">
        AXPT • Nommo Transmission
      </h1>

      {/* 🔴 LIVE BADGE + Viewer Counter */}
      <div className="absolute top-6 left-6 z-30 flex items-center gap-4">

        {/* Live Badge */}
        {isLive && (
          <div className="flex items-center px-4 py-1 bg-red-600/80 rounded-full shadow-[0_0_18px_rgba(255,0,0,0.8)] animate-pulse">
            <span className="w-2 h-2 bg-red-300 rounded-full animate-ping mr-2" />
            <span className="text-sm font-semibold">LIVE</span>
          </div>
        )}

        {/* Viewer Count */}
        <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-sm border border-white/10">
          👁 {viewerCount} watching
        </div>
      </div>

      {/* 📺 OFFLINE STATE */}
      {!isLive && !loading && (
        <div className="w-full max-w-4xl rounded-xl overflow-hidden border border-white/10 shadow-[0_0_25px_rgba(255,255,255,0.05)]">
          <img
            src="/live/offline.png"
            alt="Stream Offline"
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      {/* 🎥 LIVE PLAYER */}
      {isLive && (
        <video
          ref={videoRef}
          controls
          autoPlay
          playsInline
          className="w-full max-w-4xl rounded-xl shadow-[0_0_35px_rgba(0,0,0,0.6)] border border-white/10 transition-transform duration-500 hover:scale-[1.01]"
        />
      )}

      {/* Footer */}
      <p className="mt-6 text-sm opacity-50">
        Streaming via AXPT Live Engine
      </p>
    </main>
  );
}