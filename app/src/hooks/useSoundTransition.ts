'use client';

import { useEffect, useRef } from 'react';
import { Howl } from 'howler';

export function useSoundTransition(src: string, volume = 0.5) {
  const soundRef = useRef<Howl | null>(null);

  useEffect(() => {
    soundRef.current = new Howl({ src: [src], volume });
    return () => {
      soundRef.current?.unload();
    };
  }, [src]);

  const play = () => {
    soundRef.current?.play();
  };

  return play;
}