"use client";
import { useEffect } from "react";

/** Local-only evidence. Records lifecycle and control category; no URLs, names, or sessions. */
export default function WorkspaceNavigationProbe() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const key = "arp:workspace-lifecycle:v1";
    let lastControl = "none";
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const documentStartedAt = performance.timeOrigin;
    let previous: unknown = null;
    try { previous = JSON.parse(sessionStorage.getItem(key) || "null"); } catch { /* Optional diagnostics. */ }
    function report(phase: string, persisted = false) {
      console.info("[ARP_WORKSPACE_LIFECYCLE]", {
        phase, documentStartedAt, navigationType: navigation?.type ?? "unknown", lastControl, persisted,
      });
    }
    function exit(event: Event) {
      const persisted = "persisted" in event && event.persisted === true;
      try { sessionStorage.setItem(key, JSON.stringify({ phase: event.type, documentStartedAt, lastControl, persisted })); } catch { /* Optional diagnostics. */ }
      report(event.type, persisted);
    }
    function click(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest("button,a,select,summary");
      if (!control) return;
      lastControl = control.getAttribute("aria-controls") === "cup-focused-material" ? "material-selector"
        : control.getAttribute("aria-controls") === "workspace-stage" ? "workspace-selector"
        : control.tagName === "A" ? "link" : control.tagName.toLowerCase();
      report("control-click");
    }
    console.info("[ARP_WORKSPACE_LIFECYCLE]", { phase: "mount", documentStartedAt, navigationType: navigation?.type ?? "unknown", previous });
    window.addEventListener("beforeunload", exit);
    window.addEventListener("pagehide", exit);
    document.addEventListener("click", click, true);
    return () => {
      report("unmount");
      window.removeEventListener("beforeunload", exit);
      window.removeEventListener("pagehide", exit);
      document.removeEventListener("click", click, true);
    };
  }, []);
  return null;
}
