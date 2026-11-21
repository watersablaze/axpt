"use client";
import Link from "next/link";
import {useEffect, useRef, useState} from "react";
import styles from "./preview.module.css";
export default function DossierPreview({dossierId, recipientEmail}: {dossierId: string; recipientEmail: string}) {
  const [expanded, setExpanded] = useState(false);
  const [mobile, setMobile] = useState(false);
  const surface = useRef<HTMLElement>(null);
  const enterButton = useRef<HTMLButtonElement>(null);
  const exitButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    function changed() { if (!document.fullscreenElement) setExpanded(false); }
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape" && !document.fullscreenElement) setExpanded(false);
    }
    document.addEventListener("fullscreenchange", changed);
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("fullscreenchange", changed);
      document.removeEventListener("keydown", keydown);
    };
  }, []);
  useEffect(() => {
    if (expanded) exitButton.current?.focus();
  }, [expanded]);
  async function enter() {
    setExpanded(true);
    try { await surface.current?.requestFullscreen?.(); } catch { /* Viewport fallback stays available. */ }
  }
  async function exit() {
    if (document.fullscreenElement === surface.current) {
      try { await document.exitFullscreen(); } catch { /* Restore viewport layout below. */ }
    }
    setExpanded(false);
    enterButton.current?.focus();
  }
  return <main ref={surface} className={[styles.preview, expanded ? styles.expanded : ""].join(" ")}>
    {expanded ? <button ref={exitButton} type="button" className={styles.exit} onClick={() => void exit()}>← Back to Admin Preview</button> :
      <header className={styles.toolbar}>
        <div className={styles.identity}>
          <Link href="/admin/representative-program/buyer-dossiers">← Buyer Dossiers</Link>
          <h1>Buyer Dossier · Recipient Preview</h1>
          <p>{recipientEmail} · Admin preview · No recipient session or read receipt</p>
        </div>
        <div className={styles.actions}>
          <div className={styles.widths} role="group" aria-label="Preview width">
            <button type="button" aria-pressed={!mobile} onClick={() => setMobile(false)}>Desktop</button>
            <button type="button" aria-pressed={mobile} onClick={() => setMobile(true)}>Mobile</button>
          </div>
          <button ref={enterButton} type="button" className={styles.primary} onClick={() => void enter()}>View recipient surface full screen ↗</button>
        </div>
      </header>}
    <div className={[styles.stage, !expanded && mobile ? styles.mobile : ""].join(" ")}>
      <iframe title="Buyer dossier · Recipient presentation" src={`/admin/representative-program/buyer-dossiers/${encodeURIComponent(dossierId)}/preview/document`} className={styles.frame} sandbox="allow-scripts allow-same-origin" />
    </div>
  </main>;
}
