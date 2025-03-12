import React from "react";
import styles from "./Overlay.module.css";

interface OverlayProps {
  isOpen: boolean;
  closeHUD: () => void; // ✅ Added to fix Dashboard.tsx error
  children: React.ReactNode;
}

const Overlay: React.FC<OverlayProps> = ({ isOpen, closeHUD, children }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={closeHUD}>
      <div className={styles.overlayContent} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export default Overlay;