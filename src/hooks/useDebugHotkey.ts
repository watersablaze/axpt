'use client';

import { useEffect } from 'react';

export function useDebugHotkey(toggle: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      console.log("hotkey", {
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey,
        key: e.key
      });

      // WORKS IN ALL BROWSERS / OS
      // 1) Ctrl + Space
      if (e.ctrlKey && e.key === ' ') {
        console.log('🔥 Nommo Oracle: Ctrl + Space');
        e.preventDefault();
        toggle();
        return;
      }

      // 2) Command + Shift + D
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        console.log('🔥 Nommo Oracle: Cmd + Shift + D');
        e.preventDefault();
        toggle();
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);
}