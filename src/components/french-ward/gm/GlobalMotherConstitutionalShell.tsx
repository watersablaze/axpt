"use client";

import {
  Children,
  useRef,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import styles from "./GlobalMotherConstitutionalShell.module.css";

type Movement = {
  index: string;
  label: string;
  active?: boolean;
};

type GlobalMotherConstitutionalShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  reference: string;
  version: string;
  status: string;
  movements: Movement[];
  recipient?: { name: string; institution: string; capacity: string } | null;
  children: ReactNode;
};

export function GlobalMotherConstitutionalShell({
  title,
  subtitle,
  reference,
  status,
  movements,
  recipient,
  children,
}: GlobalMotherConstitutionalShellProps) {
  const chambers =
    Children.toArray(children);

  const chamberRef = useRef<HTMLElement>(null);
  const notationRef = useRef<HTMLElement>(null);

  const initialIndex =
    Math.max(
      0,
      movements.findIndex(
        movement => movement.active,
      ),
    );

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(initialIndex);

  const activeMovement =
    movements[activeIndex] ??
    movements[0];

  const activeChamber =
    chambers[activeIndex] ??
    chambers[0] ??
    null;

  const previousIndex =
    activeIndex > 0
      ? activeIndex - 1
      : null;

  const nextIndex =
    activeIndex < movements.length - 1
      ? activeIndex + 1
      : null;

  const selectChamber = (
    index: number,
  ) => {
    if (index === activeIndex) return;
    setActiveIndex(index);
    if (chamberRef.current) chamberRef.current.scrollTop = 0;
    requestAnimationFrame(() => notationRef.current?.focus({ preventScroll: true }));
  };

  return (
    <main className={styles.shell}>
      <div
        className={styles.atmosphere}
        aria-hidden="true"
      />

      <header id="gm-document-identity" tabIndex={-1} className={styles.documentIdentity}>
        <div>
          <strong>
            {title}
          </strong>

          <p>
            {subtitle}
          </p>
        </div>

        <span>
          {reference}
        </span>
      </header>

      <div className={styles.pamphlet}>
        <header className={styles.utility}>
          <span>
            French-Ward
          </span>

        </header>

        <div className={styles.constitutionalBody}>
          <aside
            className={styles.councilSpine}
            aria-label="Framework council spine"
          >
            <div className={styles.spineIdentity}>
              <span>
                Global Mother
              </span>

              <strong>
                Institutional Framework
              </strong>
            </div>

            <section className={styles.spineRecipient}>
              <span>
                Prepared for
              </span>

              <strong>
                {recipient?.name ?? "Dr. Awulah Naanii Amon"}
              </strong>

              <p>
                {recipient?.institution ?? "Nubian Empress Omaedro II"}
              </p>

              <p>
                {recipient?.capacity ?? "Global Mother · Royal Council Representative"}
              </p>
            </section>

            <section className={styles.spineStanding}>
              <span>
                Standing
              </span>

              <strong>
                {status}
              </strong>
            </section>

            <nav
              className={styles.spineFramework}
              aria-label="Order of the Framework"
            >
              <span className={styles.spineFrameworkLabel}>
                Framework
              </span>

              {movements.map(
                (
                  movement,
                  index,
                ) => {
                  const active =
                    index === activeIndex;

                  return (
                    <button
                      key={movement.index}
                      type="button"
                      className={
                        active
                          ? `${styles.spineMovement} ${styles.spineMovementActive}`
                          : styles.spineMovement
                      }
                      onClick={() =>
                        selectChamber(index)
                      }
                      aria-current={
                        active
                          ? "step"
                          : undefined
                      }
                    >
                      <span>
                        {movement.index}
                      </span>

                      <strong>
                        {movement.label}
                      </strong>
                    </button>
                  );
                },
              )}
            </nav>
          </aside>

          <section
            id="gm-active-chamber"
            ref={chamberRef}
            className={styles.activeChamber}
            aria-live="polite"
          >
            <header className={styles.chamberNotation} ref={notationRef} tabIndex={-1}>
              <div>
                <span>
                  Article
                </span>

                <strong>
                  {activeMovement?.index}
                </strong>
              </div>

              <span>
                {activeIndex + 1} of {movements.length}
              </span>
            </header>

            <div className={styles.chamberContent}>
              {activeChamber}
            </div>

            <nav
              className={styles.chamberProgression}
              aria-label="Framework progression"
            >
              <div>
                {previousIndex !== null ? (
                  <button
                    type="button"
                    onClick={() =>
                      selectChamber(
                        previousIndex,
                      )
                    }
                  >
                    <span>
                      Previous
                    </span>

                    <strong>
                      {
                        movements[
                          previousIndex
                        ]?.label
                      }
                    </strong>
                  </button>
                ) : (
                  <span
                    className={
                      styles.progressionBoundary
                    }
                  >
                    Beginning of Framework
                  </span>
                )}
              </div>

              <div>
                {nextIndex !== null ? (
                  <button
                    type="button"
                    onClick={() =>
                      selectChamber(
                        nextIndex,
                      )
                    }
                  >
                    <span>
                      Next
                    </span>

                    <strong>
                      {
                        movements[
                          nextIndex
                        ]?.label
                      }
                    </strong>
                  </button>
                ) : (
                  <span
                    className={
                      styles.progressionBoundary
                    }
                  >
                    Deliberative threshold reached
                  </span>
                )}
              </div>
            </nav>
          </section>
        </div>

        <footer className={styles.footer}>
          <span>
            Private Institutional Framework
          </span>
          <button type="button" className={styles.topAction} onClick={() => {
            chamberRef.current?.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
            notationRef.current?.focus({ preventScroll: true });
          }}>Back to article top ↑</button>
        </footer>
      </div>
    </main>
  );
}
