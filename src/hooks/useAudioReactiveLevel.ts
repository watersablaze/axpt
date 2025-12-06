// src/hooks/useAudioReactiveLevel.ts
'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Audio-reactive hook that reads from the Nommo video element
 * and returns a normalized level between 0 and ~1.
 *
 * - Looks for <video data-nommo-player>
 * - Falls back gracefully if not available
 */
export function useAudioReactiveLevel() {
  const [level, setLevel] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const video =
      (document.querySelector('video[data-nommo-player]') as HTMLVideoElement | null) ??
      (document.querySelector('video') as HTMLVideoElement | null);

    if (!video) {
      console.warn('[AudioReactive] No video element found.');
      return;
    }

    // Some browsers require user gesture before AudioContext
    let audioCtx: AudioContext | null = null;
    let source: MediaElementAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array | null = null;

    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;

      source = audioCtx.createMediaElementSource(video);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);

      dataArray = new Uint8Array(analyser.frequencyBinCount);
    } catch (err) {
      console.warn('[AudioReactive] Failed to init AudioContext:', err);
      return;
    }

    const tick = () => {
      if (!analyser || !dataArray) return;

      analyser.getByteFrequencyData(dataArray);

      // simple RMS-ish average
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;

      // normalize 0–1, lightly compressed
      const normalized = Math.min(1, Math.max(0, avg / 160));
      setLevel(normalized);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
      try {
        if (source) source.disconnect();
        if (analyser) analyser.disconnect();
        if (audioCtx) audioCtx.close();
      } catch {
        // ignore
      }
    };
  }, []);

  return level;
}