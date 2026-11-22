"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function IncomingRefresh() {
  const router = useRouter();
  const [automatic, setAutomatic] = useState(true);
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    if (!automatic) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        startTransition(() => router.refresh());
      }
    }, 60000);
    return () => window.clearInterval(timer);
  }, [automatic, router]);
  return <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
    <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}
      className="rounded border border-slate-600 px-3 py-2 disabled:opacity-50">
      {pending ? "Refreshing…" : "Refresh inbox"}
    </button>
    <label className="flex items-center gap-2"><input type="checkbox" checked={automatic}
      onChange={event => setAutomatic(event.target.checked)} />Refresh every minute while visible</label>
    <span role="status" className="text-xs text-slate-400">{pending ? "Updating incoming records…" : ""}</span>
  </div>;
}
