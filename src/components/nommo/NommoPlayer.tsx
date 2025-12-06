// src/components/nommo/player/NommoPlayer.tsx
'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import CeremonyEngine from '../ceremony/CeremonyEngine';

interface NommoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function NommoPlayer({
  src,
  poster,
  title,
  subtitle,
  className,
}: NommoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleTogglePlay = () => {
    const el = videoRef.current;
    if (!el) return;

    if (el.paused) {
      void el.play();
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  return (
    <div
      className={clsx(
        'relative w-full max-w-5xl mx-auto',
        'rounded-2xl overflow-hidden',
        'bg-black border border-white/10',
        'shadow-[0_0_60px_rgba(0,0,0,0.9)]',
        className
      )}
    >
      {/* Glow frame */}
      <div className="pointer-events-none absolute inset-[-1px] rounded-2xl border border-white/10" />
      <div className="pointer-events-none absolute -inset-10 bg-gradient-radial from-white/5 via-transparent to-transparent opacity-40 blur-3xl" />

      {/* Video container */}
      <div
        className="relative aspect-video bg-black"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <video
          ref={videoRef}
          data-nommo-player
          src={src}
          poster={poster}
          onEnded={handleVideoEnd}
          className="w-full h-full object-cover"
          controls
          playsInline
        />

        {/* Ceremony / aura overlay */}
        <CeremonyEngine />

        {/* Cinematic vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_55%,rgba(0,0,0,0.6)_100%)]" />

        {/* Center play overlay */}
        <button
          type="button"
          onClick={handleTogglePlay}
          className={clsx(
            'absolute inset-0 flex items-center justify-center',
            'transition-opacity duration-300',
            isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'
          )}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{
              scale: isHovered ? 1.05 : 1,
              opacity: 1,
            }}
            className="flex items-center justify-center w-20 h-20 rounded-full bg-black/70 border border-white/30 backdrop-blur-md"
          >
            <div className="ml-1 w-0 h-0 border-t-[12px] border-b-[12px] border-l-[20px] border-t-transparent border-b-transparent border-l-white" />
          </motion.div>
        </button>

        {/* Top-left title overlay */}
        {(title || subtitle) && (
          <div className="pointer-events-none absolute left-4 top-4 max-w-xs text-left">
            {title && (
              <div className="inline-flex items-center rounded-full bg-black/60 px-3 py-1 border border-white/10 text-xs uppercase tracking-[0.12em] text-white/80 mb-2">
                {title}
              </div>
            )}
            {subtitle && (
              <p className="text-xs text-white/70 leading-snug bg-black/50 rounded-md px-2 py-1 backdrop-blur-sm">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}