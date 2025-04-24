"use client";

import styles from "./Overlay.module.css";

interface OverlayProps {
  isOpen: boolean;
  closeHUD: () => void;
  children: React.ReactNode;
}

export default function Overlay({ isOpen, closeHUD, children }: OverlayProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={closeHUD}>
      {/* ✅ Stop click propagation inside HUD so clicking inside doesn't close it */}
      <div className={styles.overlayContent} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}