"use client";

import { Children, useEffect, useRef, useState, type ReactNode  } from "react";
import canvas from "./workspace-canvas.module.css";

const directory = [
  ["overview", "Overview"],
  ["cup", "Commercial Utility Pack"],
  ["appointment", "Appointment"],
  ["authority", "Authority Register"],
  ["program", "Program Record"],
  ["communications", "Field Communications"],
  ["guide", "Guide"],
] as const;

type View = (typeof directory)[number][0];

export default function WorkspaceStage({
  identity, overview, cup, appointment, authority, program, communications, position, guide, storageKey,
}: {
  storageKey: string;
  guide: ReactNode;
  identity: ReactNode;
  overview: ReactNode;
  cup: ReactNode;
  appointment: ReactNode;
  authority: ReactNode;
  program: ReactNode;
  communications: ReactNode;
  position: ReactNode;
}) {
  const [view, setView] = useState<View>("overview");

  useEffect(() => {
    let next: View = "overview";
    try {
      const saved = sessionStorage.getItem(storageKey);
      const requested = new URLSearchParams(window.location.search).get("view");
      next =
        directory.find(([key]) => key === requested)?.[0] ??
        directory.find(([key]) => key === saved)?.[0] ??
        "overview";
    } catch {
      // Browser storage is optional.
    }
    if (window.location.hash === "#buyer-invitation") next = "cup";
    setView(next);
  }, [storageKey]);
  useEffect(() => {
    if (view === "cup" && window.location.hash === "#buyer-invitation") {
      document.getElementById("buyer-invitation")?.scrollIntoView({ block: "start" });
    }
  }, [view]);
  const stage = useRef<HTMLDivElement>(null);
  const views = {
    overview,
    cup,
    appointment,
    authority,
    program,
    communications,
    guide,
  };

  function select(next: View) {
    try {
      sessionStorage.setItem(storageKey, next);
    } catch {
      // Navigation remains available without storage.
    }
    setView(next);
    stage.current?.focus({ preventScroll: true });
  }

  return (
    <>
      <div className={canvas.workspaceCrown}>
        {Children.toArray(identity)}
      </div>

      <div className={canvas.shell}>
        <div className={canvas.mobileDirectory}>
        <label>
          <span className={canvas.kicker}>Workspace</span>
          <select value={view} onChange={event => {
            const match = directory.find(([key]) => key === event.target.value);
            if (match) select(match[0]);
          }}>
            {directory.filter(([key]) => key !== "guide").map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
            <option value="guide">Guide · Orientation</option>
          </select>
        </label>
        <button type="button" onClick={() => select("guide")}
          aria-current={view === "guide" ? "page" : undefined}
          aria-controls="workspace-stage">
          <span aria-hidden="true">✧</span> Guide
        </button>
      </div>

      <aside className={canvas.directory}>
        <p className={canvas.kicker}>Workspace Directory</p>
        <nav aria-label="Workspace views">
          {directory.filter(([key]) => key !== "guide").map(([key, label], index) => (
            <button
              key={key}
              type="button"
              aria-current={view === key ? "page" : undefined}
              aria-controls="workspace-stage"
              onClick={() => select(key)}
            >
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              {label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className={canvas.guideControl}
          aria-current={view === "guide" ? "page" : undefined}
          aria-controls="workspace-stage"
          onClick={() => select("guide")}
        >
          <span className={canvas.guideControlMark} aria-hidden="true">✧</span>
          <span>Guide <small>Orientation</small></span>
        </button>
        <p className={canvas.directoryNote}>French-Ward<br />Representative Workspace</p>
      </aside>

      <div className={canvas.center}>
        <div
          id="workspace-stage"
          ref={stage}
          tabIndex={-1}
          className={canvas.stage}
          aria-label={directory.find(([key]) => key === view)?.[1]}
          onClick={event => {
            if (!(event.target instanceof Element)) return;
            const anchor = event.target.closest("a");
            const destination = anchor?.getAttribute("href");
            if (destination === "#field-resources" ||
                destination === "#workspace-guide" ||
                destination === "#workspace-overview") {
              event.preventDefault();
              select(destination === "#field-resources" ? "cup"
                : destination === "#workspace-guide" ? "guide" : "overview");
            }
          }}
        >
          <div key={view} className={canvas.stageArrival}>
            {Children.toArray(views[view])}
            {view !== "overview" ? (
              <button
                type="button"
                className={canvas.returnOverview}
                onClick={() => select("overview")}
              >
                ← Return to Overview
              </button>
            ) : null}
          </div>
        </div>
      </div>

        {Children.toArray(position)}
      </div>
    </>
  );
}
