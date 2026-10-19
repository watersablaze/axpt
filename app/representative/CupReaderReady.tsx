"use client";
import { useEffect } from "react";
export function reportReaderState(state: "ready" | "error") {
  if (window.parent !== window) window.parent.postMessage({ type: "arp:material-state", state }, window.location.origin);
}
/** The outer reader remains covered until the actual publication has hydrated. */
export default function CupReaderReady({ state = "ready" }: { state?: "ready" | "error" }) {
  useEffect(() => {
    const frame = requestAnimationFrame(() => reportReaderState(state));
    return () => cancelAnimationFrame(frame);
  }, [state]);
  return null;
}
