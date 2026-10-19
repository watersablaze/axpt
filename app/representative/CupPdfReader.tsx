"use client";
import { useEffect, useState } from "react";

type State = { kind: "loading" } | { kind: "ready"; url: string } | { kind: "error"; message: string };
export default function CupPdfReader({ href, title }: { href: string; title: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    let objectUrl: string | undefined;
    const timeout = setTimeout(() => controller.abort(), 60000);
    setState({ kind: "loading" });
    async function load() {
      try {
        const response = await fetch(href, { credentials: "same-origin", cache: "no-store", redirect: "error", signal: controller.signal });
        if (!response.ok) {
          const message = response.status === 401 ? "Your session has ended. Sign in again from the workspace."
            : [403, 404].includes(response.status) ? "This document is not currently available under your access."
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
  return <section aria-label={title} style={{ minHeight: 520, background: "#0c1d25", color: "#d0e0e4", fontFamily: "Arial, sans-serif" }}>
    {state.kind === "loading" ? <p role="status" style={{ margin: 0, padding: 24, fontSize: 13 }}>Loading protected document…</p> : null}
    {state.kind === "error" ? <div style={{ padding: 24 }}>
      <p role="alert">{state.message}</p>
      <button type="button" onClick={() => setAttempt(value => value + 1)}
        style={{ padding: "10px 16px", border: "1px solid #8eafb9", color: "#eed5a5", background: "transparent", cursor: "pointer" }}>Try again</button>
    </div> : null}
    {state.kind === "ready" ? <iframe title={title} src={state.url}
      style={{ display: "block", border: 0, width: "100%", height: "94vh", minHeight: 520 }} /> : null}
  </section>;
}
