"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
type Snapshot = { pending: string | null; field?: string | null; checkedAt: string };
export default function AdminAttention() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let stopped = false;
    let controller: AbortController | null = null;
    let lastStarted = 0;
    async function refresh() {
      if (document.hidden || controller || Date.now() - lastStarted < 120_000) return;
      lastStarted = Date.now();
      const active = new AbortController();
      controller = active;
      const timeout = setTimeout(() => active.abort(), 30_000);
      try {
        const response = await fetch("/api/admin/incoming/attention", {
          cache: "no-store", signal: active.signal,
        });
        const body = await response.json();
        if (!response.ok || body.ok !== true ||
          !(body.pending === null || typeof body.pending === "string") ||
          !(body.field === undefined || body.field === null || typeof body.field === "string") ||
          typeof body.checkedAt !== "string") throw new Error("Unavailable");
        if (!stopped) { setSnapshot(body); setFailed(false); }
      } catch {
        if (!stopped) { setSnapshot(null); setFailed(true); }
      } finally { clearTimeout(timeout); controller = null; }
    }
    void refresh();
    const timer = setInterval(() => { void refresh(); }, 120_000);
    const visible = () => { void refresh(); };
    document.addEventListener("visibilitychange", visible);
    return () => {
      stopped = true; clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
      controller?.abort();
    };
  }, []);
  const label = (value: string | null | undefined) =>
    failed || value === null ? "Unavailable" : value ?? "Checking…";
  const style = "inline-flex min-h-9 items-center rounded-md border border-amber-200/15 bg-amber-100/[.025] px-2.5 py-1.5 text-[11px] font-medium tabular-nums text-amber-100/85 transition-colors hover:border-amber-200/40 hover:bg-amber-100/[.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-200";
  return (
    <nav aria-label="Admin attention" className="flex flex-wrap gap-2"
      title={snapshot ? `Checked ${new Date(snapshot.checkedAt).toLocaleTimeString()}. Updates every two minutes while visible.` : undefined}>
      <Link href="/admin/incoming" className={style}>Pending requests · {label(snapshot?.pending)}</Link>
      {(!snapshot || snapshot.field !== undefined) &&
        <Link href="/admin/incoming?lane=field" className={style}>Unread field activity · {label(snapshot?.field)}</Link>}
    </nav>
  );
}
