"use client";
import { useEffect } from "react";

export function LiveAttach({ videoId }: { videoId: string }) {
  useEffect(() => {
    const video = document.getElementById(videoId) as HTMLVideoElement | null;
    if (!video) return;
    import("hls.js").then(({ default: Hls }) => {
      if (!Hls.isSupported()) return;
      const src = video.querySelector("source")?.getAttribute("src");
      if (!src) return;
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
    });
  }, [videoId]);
  return null;
}