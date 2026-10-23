"use client";
import Link from "next/link";
import {useEffect, useRef, useState} from "react";
import styles from "./intake-preview.module.css";
export default function IntakePreview({reference, version}: {reference: string; version: number}) {
  const [expanded, setExpanded] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [interactive, setInteractive] = useState(false);
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
    {expanded ? <button ref={exitButton} type="button" className={styles.exit} onClick={() => void exit()}>← Back to Admin Preview · No submission</button> :
      <header className={styles.toolbar}>
        <div className={styles.identity}>
          <Link href="/admin/representative-program">← ARP Administration</Link>
          <h1>French-Ward · LOI & Transaction Intake</h1>
          <p>{reference} · Pathway version {version} · {interactive ? "Interactive preview · Submission blocked · Nothing saved" : "Read-only admin preview"}</p>
        </div>
        <div className={styles.actions}>
          <button type="button" aria-pressed={interactive} onClick={() => setInteractive(value => !value)}>{interactive ? "Interactive preview: on" : "Test form interactions"}</button>
          <div className={styles.widths} role="group" aria-label="Preview width">
            <button type="button" aria-pressed={!mobile} onClick={() => setMobile(false)}>Desktop</button>
            <button type="button" aria-pressed={mobile} onClick={() => setMobile(true)}>Mobile</button>
          </div>
          <button ref={enterButton} type="button" className={styles.primary} onClick={() => void enter()}>View form full screen ↗</button>
        </div>
      </header>}
    <div className={[styles.stage, !expanded && mobile ? styles.mobile : ""].join(" ")}>
      <iframe key={interactive ? "interactive" : "readonly"} title={interactive ? "French-Ward LOI · Interactive preview, submission blocked" : "French-Ward LOI · Read-only form presentation"} src={"/admin/instruments/french-ward-commercial-intake/preview/document" + (interactive ? "?interactive=1" : "")} className={styles.frame} sandbox="allow-scripts allow-same-origin" />
    </div>
  </main>;
}
