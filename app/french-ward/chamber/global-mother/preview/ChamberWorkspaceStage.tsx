"use client";

import { useRef, useState, type ReactNode } from "react";
import styles from "./page.module.css";

type Place = "home" | "relationships" | "workstreams" | "constitution";
const directory: readonly { key: Place; label: string; number: string }[] = [
  { key: "home", label: "Home", number: "01" },
  { key: "relationships", label: "Relationships", number: "02" },
  { key: "workstreams", label: "Workstreams", number: "03" },
  { key: "constitution", label: "Constitutional hall", number: "04" },
];

export default function ChamberWorkspaceStage({
  cycleLabel, instrumentReference, participantCount, workstreamCount,
  home, relationships, workstreams, constitution, context,
}: {
  cycleLabel: string;
  instrumentReference: string;
  participantCount: number;
  workstreamCount: number | null;
  home: ReactNode;
  relationships: ReactNode;
  workstreams: ReactNode;
  constitution: ReactNode;
  context: ReactNode;
}) {
  const [place, setPlace] = useState<Place>("home");
  const stageRef = useRef<HTMLElement>(null);
  const content: Record<Place, ReactNode> = { home, relationships, workstreams, constitution };

  function enter(next: Place) {
    setPlace(next);
    stageRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.navigation} aria-label="Chamber directory">
        <div className={styles.navHeading}>
          <span className={styles.eyebrow}>GLOBAL MOTHER</span>
          <strong>Institutional Chamber</strong>
          <small>{instrumentReference} · {cycleLabel}</small>
        </div>
        <nav className={styles.navLinks} aria-label="Chamber places">
          {directory.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => enter(item.key)}
              aria-current={place === item.key ? "page" : undefined}
              aria-controls="gm-chamber-stage"
            >
              {item.label}
              <span>{item.key === "relationships" ? participantCount : item.key === "workstreams" ? (workstreamCount ?? "—") : item.number}</span>
            </button>
          ))}
        </nav>
        <div className={styles.navFooter}>
          <span>Private institutional place</span>
          <p>Orientation and preparation are not institutional admission.</p>
          <a href="/french-ward/instruments/gm-kenya?previewVersion=4">View constitutional instrument</a>
        </div>
      </aside>
      <section
        id="gm-chamber-stage"
        ref={stageRef}
        className={styles.stage}
        aria-label={`${directory.find(item => item.key === place)?.label ?? "Home"} · Chamber workstage`}
        tabIndex={-1}
      >
        <div key={place} className={styles.stageArrival}>
          {content[place]}
        </div>
      </section>
      <aside className={styles.context} aria-label="Current institutional context">
        {context}
      </aside>
    </div>
  );
}
