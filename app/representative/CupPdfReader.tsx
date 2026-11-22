"use client";
import { useEffect, useState } from "react";
import styles from "./cup-reading.module.css";
import CupReaderStatus from "./CupReaderStatus";
import { reportReaderState } from "./CupReaderReady";

type State = { kind: "loading" } | { kind: "ready"; url: string } | { kind: "error"; message: string };
export default function CupPdfReader({ href, title, fillViewport = false }: { href: string; title: string; fillViewport?: boolean }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [frameReady, setFrameReady] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    let objectUrl: string | undefined;
    const timeout = setTimeout(() => controller.abort(), 60000);
    setState({ kind: "loading" });
    setFrameReady(false);
    async function load() {
      try {
        const response = await fetch(href, { credentials: "same-origin", cache: "no-store", redirect: "error", signal: controller.signal });
        if (!response.ok) {
          const message = response.status === 401 ? "Your session has ended. Sign in again from the workspace."
            : [403, 404].includes(response.status) ? "This document is currently unavailable. Return to the CUP or try again."
            : "The document service is temporarily unavailable. Try again shortly.";
          if (!disposed) setState({ kind: "error", message });
          return;
        }
        if (!response.headers.get("content-type")?.toLowerCase().startsWith("application/pdf")) {
          throw new Error("UNEXPECTED_DOCUMENT_RESPONSE");
        }
        const bytes = await response.blob();
        if (!bytes.size) throw new Error("EMPTY_DOCUMENT_RESPONSE");
        if (disposed) return;
        objectUrl = URL.createObjectURL(bytes);
        setState({ kind: "ready", url: objectUrl });
      } catch {
        if (!disposed) setState({ kind: "error", message: "The document could not be loaded. Check your connection and try again." });
      } finally { clearTimeout(timeout); }
    }
    void load();
    return () => { disposed = true; clearTimeout(timeout); controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [href, attempt]);
  useEffect(() => {
    if (state.kind === "error") reportReaderState("error");
    else if (state.kind === "ready" && frameReady) reportReaderState("ready");
  }, [state, frameReady]);
  return <section aria-label={title} className={styles.pdfViewport}
    style={fillViewport ? { height: "100dvh", minHeight: 0 } : undefined}
    aria-busy={state.kind === "loading" || (state.kind === "ready" && !frameReady)}>
    {state.kind === "loading" || (state.kind === "ready" && !frameReady)
      ? <div className={styles.readerOverlay}><CupReaderStatus /></div> : null}
    {state.kind === "error" ? <CupReaderStatus error={state.message} retry={() => setAttempt(value => value + 1)} /> : null}
    {state.kind === "ready" ? <iframe title={title} src={state.url}
      onLoad={() => setFrameReady(true)} className={styles.pdfFrame}
      style={{ visibility: frameReady ? "visible" : "hidden" }} /> : null}
  </section>;
}
