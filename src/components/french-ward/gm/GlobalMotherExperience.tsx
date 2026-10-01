"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import styles from "./GlobalMotherExperience.module.css";

type ExperienceStage = "gate" | "opening" | "framework";

type GlobalMotherExperienceProps = {
  enabled: boolean;
  children: ReactNode;
  recipient?: { name: string; institution: string; capacity: string } | null;
};

function Seal() {
  return <img className={styles.chamberSigil} src="/sigil/sigil_center_version.png"
    width={112} height={63} alt="AXPT sigil" />;
}

export function GlobalMotherExperience({
  enabled,
  children,
  recipient,
}: GlobalMotherExperienceProps) {
  const [stage, setStage] =
    useState<ExperienceStage>("gate");
  const [entering, setEntering] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (transitionTimer.current) clearTimeout(transitionTimer.current); }, []);
  useEffect(() => {
    if (stage === "gate") return;
    const id = stage === "opening" ? "gm-opening-heading" : "gm-document-identity";
    document.getElementById(id)?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [stage]);
  function enter(next: ExperienceStage) {
    if (entering) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setStage(next); return; }
    setEntering(true);
    transitionTimer.current = setTimeout(() => {
      setStage(next); setEntering(false); transitionTimer.current = null;
    }, 320);
  }
  function backToTop() {
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    document.getElementById(stage === "opening" ? "gm-opening-heading" : "gm-gate-heading")?.focus({ preventScroll: true });
  }


  if (!enabled) {
    return <>{children}</>;
  }

  if (stage === "framework") {
    return (
      <div className={styles.frameworkField}>
        {children}
      </div>
    );
  }

  return (
    <main className={`${styles.experience} ${entering ? styles.departing : ""}`} aria-busy={entering}>
      <div
        className={styles.atmosphere}
        aria-hidden="true"
      />

      <div
        className={styles.axis}
        aria-hidden="true"
      />

      <header className={styles.utility}>
        <span>
          French-Ward / AXPT
        </span>

        <span>
          Private Institutional Environment
        </span>
      </header>

      {stage === "gate" ? (
        <section
          className={`${styles.stage} ${styles.gate}`}
          aria-labelledby="gm-gate-heading"
        >
          <div className={styles.gatePrelude}><Seal /></div>
          <p className={styles.stageKicker}>Global Mother · Institutional Framework</p>
          <h1 id="gm-gate-heading" tabIndex={-1}><span>Framework of Royal Custodianship</span><em>Restoration &amp; Global Trade</em></h1>
          <div className={styles.prepared}>
            <span>Prepared for</span>
            <h2>{recipient?.name ?? "Dr. Awulah Naanii Amon"}</h2>
            <p>{recipient?.institution ?? "ND Royal Ministry"}</p>
            <p>{recipient?.capacity ?? "Global Mother · Royal Council Representative"}</p>
          </div>
          <div className={styles.gateStatement}>
            <p>You are formally invited to review the proposed relationship and respond to its eight intentions.</p>
          </div>

          <button
            type="button"
            className={styles.primaryAction}
            disabled={entering}
            onClick={() =>
              enter("opening")
            }
          >
            Enter the Framework
          </button>

          <p className={styles.thresholdNotice}>
            Entering opens the Framework for review. It does not constitute agreement,
            confer authority, or execute an instrument.
          </p>
        </section>
      ) : null}

      {stage === "opening" ? (
        <section
          className={`${styles.stage} ${styles.openingFolio}`}
          aria-labelledby="gm-opening-heading"
        >
          <p className={styles.stageKicker}>Opening folio</p>

          <h1 id="gm-opening-heading" tabIndex={-1}>
            Read with care.<br /><em>Respond with intention.</em>
          </h1>

          <p className={styles.folioLead}>
            Five articles set out the proposed relationship and its responsibilities. Eight intentions invite your considered response.
          </p>
          <div className={styles.prepared}>
            <span>Prepared for</span>
            <h2>{recipient?.name ?? "Dr. Awulah Naanii Amon"}</h2>
            <p>{recipient?.institution ?? "ND Royal Ministry"}</p>
            <p>{recipient?.capacity ?? "Global Mother · Royal Council Representative"}</p>
          </div>

          <div className={styles.folioColumns}>
            <div>
              <span>Read</span>
              <p>Explore relationship, custodianship, gold passage, and continuity. The article rail keeps your place.</p>
            </div>

            <div>
              <span>Respond</span>
              <p>
                Affirm, clarify, propose a revision, or decline. Review all eight positions before submitting.
              </p>
            </div>
          </div>

          <p className={styles.folioBoundary}>
            Reading and responding support deliberation. Specific obligations arise through expressly formed instruments.
          </p>

          <button
            type="button"
            className={styles.primaryAction}
            disabled={entering}
            onClick={() => enter("framework")}
          >
            Read the Framework
          </button>
        </section>
      ) : null}

      <blockquote className={styles.inscription}>“Nobility is not for sale.”<cite>Global Mother · Nubian Empress Omaedro II</cite></blockquote>
      {entering ? <p className={styles.transitionStatus} role="status">Opening {stage === "gate" ? "the reception" : "the Framework"}…</p> : null}
      <footer className={styles.footer}>
        <span>
          GM-KENYA-RCF-001
        </span>

        <span>
          Controlled institutional access
        </span>
        <button type="button" onClick={backToTop} disabled={entering} className={styles.topAction}>Back to top ↑</button>
      </footer>
    </main>
  );
}
