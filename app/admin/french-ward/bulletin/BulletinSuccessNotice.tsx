"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function BulletinSuccessNotice({ children }: { children: ReactNode }) {
  const initialUrl = useRef<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (initialUrl.current === url.href) return;

    for (const key of ["saved", "published", "updated"]) {
      url.searchParams.delete(key);
    }
    initialUrl.current = url.href;
    if (url.href !== window.location.href) {
      window.history.replaceState(window.history.state, "", url);
    }
  }, [children]);

  return (
    <p role="status" className="rounded border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm [overflow-wrap:anywhere]">
      {children}
    </p>
  );
}
