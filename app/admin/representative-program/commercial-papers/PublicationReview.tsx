"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./publication-review.module.css";

type Props = { title: string; reference: string; version: number; status: string; referenceStatus: string | null; contentHash: string; publicationHash: string; html: string; children: ReactNode };

export default function PublicationReview({ title, reference, version, status, referenceStatus, contentHash, publicationHash, html, children }: Props) {
  const [format, setFormat] = useState<"react" | "html">("react");
  const [immersive, setImmersive] = useState(false);
  const surface = useRef<HTMLDivElement>(null);
  const enterButton = useRef<HTMLButtonElement>(null);
  const exitButton = useRef<HTMLButtonElement>(null);
  const wasImmersive = useRef(false);

  useEffect(() => {
    const changed = () => { if (!document.fullscreenElement) setImmersive(false); };
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);

  useEffect(() => {
    if (!immersive) {
      if (wasImmersive.current) enterButton.current?.focus();
      wasImmersive.current = false;
      return;
    }
    wasImmersive.current = true;
    exitButton.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.fullscreenElement) setImmersive(false);
    };
    document.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", escape);
    };
  }, [immersive]);

  async function enter() {
    setImmersive(true);
    try { await surface.current?.requestFullscreen?.(); }
    catch { /* The expanded viewport remains available when browser fullscreen is unavailable. */ }
  }
  async function exit() {
    if (document.fullscreenElement === surface.current) {
      try { await document.exitFullscreen(); } catch { /* Restore the viewport controls below. */ }
    }
    setImmersive(false);
  }

  return <div ref={surface} className={`${styles.surface} ${immersive ? styles.immersive : ""}`}>
    <header className={styles.toolbar}>
      <div className={styles.identity}><span className={styles.eyebrow}>CUP · Operator preview</span><h1>{immersive ? reference : title}</h1><p>Edition {String(version).padStart(2, "0")} · {immersive ? "Publication reading view" : status}</p></div>
      <div className={styles.controls}>
        <div className={styles.switcher} role="group" aria-label="Publication format">
          <button type="button" aria-pressed={format === "react"} onClick={() => setFormat("react")}>React view</button>
          <button type="button" aria-pressed={format === "html"} onClick={() => setFormat("html")}>HTML view</button>
        </div>
        {immersive ? <button ref={exitButton} type="button" onClick={() => void exit()}>Exit full screen</button> : <button ref={enterButton} type="button" onClick={() => void enter()}>Read full screen ↗</button>}
        {!immersive ? <a href="/admin/representative-program">Back to ARP</a> : null}
      </div>
    </header>
    {!immersive ? <section className={styles.reviewInfo} aria-label="Administrative review details">
      <span className={styles.badge}>Release withheld</span><p>Review the recipient publication below. Previewing does not grant access or issue this paper.</p>
      <details><summary>Edition & integrity details</summary><dl><div><dt>Reference</dt><dd>{reference} · Edition {String(version).padStart(2, "0")}</dd></div><div><dt>Registry</dt><dd>{referenceStatus ?? "Not recorded"}</dd></div><div><dt>Canonical SHA-256</dt><dd className={styles.hash}>{contentHash}</dd></div><div><dt>Reading publication SHA-256</dt><dd className={styles.hash}>{publicationHash}</dd></div><div><dt>Acceptance</dt><dd>Publication approved for representative use. Structured content and the complete HTML reading publication are pinned separately. CUP release and recipient access remain separate decisions.</dd></div></dl></details>
    </section> : null}
    <div className={styles.readingStage}>
      {format === "react" ? children : <iframe title={`${reference} Edition ${String(version).padStart(2, "0")} HTML publication preview`} sandbox="" srcDoc={html} className={styles.htmlFrame} />}
    </div>
  </div>;
}
