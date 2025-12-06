// src/components/nommo/player/VideoStream.tsx
'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import styles from './VideoStream.module.css';

export default function VideoStream() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const base =
      process.env.NEXT_PUBLIC_OWNCAST_URL?.replace(/\/+$/, '') ||
      'https://live.axpt.io';
    const src = `${base}/hls/stream.m3u8`;

    let hls: Hls | null = null;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari, iOS)
      video.src = src;
      const play = async () => {
        try {
          await video.play();
        } catch {
          // ignore autoplay errors
        }
      };
      play();
    } else if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.warn('[HLS] error', data);
      });
    } else {
      console.warn('[VideoStream] HLS not supported in this browser.');
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, []);

  return (
    <video
      ref={videoRef}
      data-nommo-player
      className={styles.video || 'w-full h-full object-cover'}
      autoPlay
      muted={false}
      controls={false}
      playsInline
    />
  );
}