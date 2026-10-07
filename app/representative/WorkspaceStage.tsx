"use client";

import { useRef, useState, type ReactNode } from "react";
import canvas from "./workspace-canvas.module.css";

const directory = [
  ["overview", "Overview"],
  ["cup", "Commercial Utility Pack"],
  ["appointment", "Appointment"],
  ["authority", "Authority Register"],
  ["program", "Program Record"],
  ["guide", "Guide"],
] as const;

type View = (typeof directory)[number][0];

export default function WorkspaceStage({
  identity, overview, cup, appointment, authority, program, position, guide,
}: {
  guide: ReactNode;
  identity: ReactNode;
  overview: ReactNode;
  cup: ReactNode;
  appointment: ReactNode;
  authority: ReactNode;
  program: ReactNode;
  position: ReactNode;
}) {
  const [view, setView] = useState<View>("overview");
  const stage = useRef<HTMLDivElement>(null);
  const views = { overview, cup, appointment, authority, program, guide };

  function select(next: View) {
    setView(next);
    stage.current?.focus({ preventScroll: true });
  }

  return (
    <div className={canvas.shell}>
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
        {identity}
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
            {views[view]}
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

      {position}
    </div>
  );
}
