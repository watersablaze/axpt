"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import styles from "./page.module.css";

type Participant = {
  name: string;
  institutionalTitle: string;
  secondaryTitle: string | null;
  reference: string | null;
  kind:
    | "GOVERNING"
    | "INSTITUTIONAL"
    | "ADMINISTRATIVE_REVIEW";
  capacityClass:
    | "STRATEGIC"
    | "OPERATIONS"
    | "FIDUCIARY"
    | null;
};

type OrientationSequenceProps = {
  participant: Participant;
};

const SCENE_COUNT = 4;
const SWIPE_THRESHOLD = 54;
const WHEEL_THRESHOLD = 24;
const WHEEL_RESET_MS = 190;

const sceneNames = [
  "Arrival",
  "Continuity",
  "The Matter",
  "Entry",
] as const;

export function OrientationSequence({
  participant,
}: OrientationSequenceProps) {
  const [scene, setScene] =
    useState(0);

  const [entering, setEntering] = useState(false);
  const [entryError, setEntryError] = useState(false);

  async function completeAndEnter() {
    if (entering) return;

    setEntering(true);
    setEntryError(false);

    try {
      const response = await fetch(
        "/api/french-ward/orientation/complete",
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("ORIENTATION_COMPLETION_FAILED");
      }

      window.location.assign("/french-ward/home");
    } catch {
      setEntryError(true);
      setEntering(false);
    }
  }


  const [direction, setDirection] =
    useState<
      "forward" | "backward"
    >("forward");

  const touchStartY =
    useRef<number | null>(null);

  const wheelReady =
    useRef(true);

  const wheelResetTimer =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const goTo =
    useCallback(
      (nextScene: number) => {
        const bounded =
          Math.max(
            0,
            Math.min(
              SCENE_COUNT - 1,
              nextScene,
            ),
          );

        setScene(current => {
          if (bounded === current) {
            return current;
          }

          setDirection(
            bounded > current
              ? "forward"
              : "backward",
          );

          return bounded;
        });
      },
      [],
    );

  const next =
    useCallback(() => {
      setScene(current => {
        if (
          current >=
          SCENE_COUNT - 1
        ) {
          return current;
        }

        setDirection("forward");
        return current + 1;
      });
    }, []);

  const previous =
    useCallback(() => {
      setScene(current => {
        if (current <= 0) {
          return current;
        }

        setDirection("backward");
        return current - 1;
      });
    }, []);

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      const target =
        event.target as HTMLElement | null;

      if (
        target?.closest(
          "a, button, input, textarea, select",
        )
      ) {
        return;
      }

      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowRight" ||
        event.key === "PageDown" ||
        event.key === " "
      ) {
        event.preventDefault();
        next();
        return;
      }

      if (
        event.key === "ArrowUp" ||
        event.key === "ArrowLeft" ||
        event.key === "PageUp"
      ) {
        event.preventDefault();
        previous();
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        goTo(
          SCENE_COUNT - 1,
        );
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
  }, [
    goTo,
    next,
    previous,
  ]);

  useEffect(() => {
    return () => {
      if (
        wheelResetTimer.current
      ) {
        clearTimeout(
          wheelResetTimer.current,
        );
      }
    };
  }, []);

  const handleWheel = (
    event: React.WheelEvent<HTMLDivElement>,
  ) => {
    if (
      wheelResetTimer.current
    ) {
      clearTimeout(
        wheelResetTimer.current,
      );
    }

    wheelResetTimer.current =
      setTimeout(() => {
        wheelReady.current =
          true;
      }, WHEEL_RESET_MS);

    if (
      !wheelReady.current ||
      Math.abs(event.deltaY) <
        WHEEL_THRESHOLD
    ) {
      return;
    }

    wheelReady.current = false;

    if (event.deltaY > 0) {
      next();
    } else {
      previous();
    }
  };

  const handleTouchStart = (
    event: React.TouchEvent<HTMLDivElement>,
  ) => {
    touchStartY.current =
      event.touches[0]?.clientY ??
      null;
  };

  const handleTouchEnd = (
    event: React.TouchEvent<HTMLDivElement>,
  ) => {
    if (
      touchStartY.current === null
    ) {
      return;
    }

    const endY =
      event.changedTouches[0]
        ?.clientY;

    if (
      typeof endY !== "number"
    ) {
      touchStartY.current =
        null;
      return;
    }

    const delta =
      touchStartY.current -
      endY;

    touchStartY.current = null;

    if (
      Math.abs(delta) <
      SWIPE_THRESHOLD
    ) {
      return;
    }

    if (delta > 0) {
      next();
    } else {
      previous();
    }
  };

  return (
    <main
      className={styles.shell}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={styles.gridField}
        aria-hidden="true"
      />

      <div
        className={styles.blueField}
        aria-hidden="true"
      />

      <header
        className={styles.brandRail}
      >
        <span><span className={styles.institutionName}>FRENCH-WARD</span></span>
        <span>
          Private Orientation
        </span>
      </header>

      <div
        className={styles.sceneMeta}
      >
        <span>
          {String(
            scene + 1,
          ).padStart(2, "0")}
          {" / "}
          {String(
            SCENE_COUNT,
          ).padStart(2, "0")}
        </span>

        <span>
          {sceneNames[scene]}
        </span>
      </div>

      <nav
        className={styles.sceneIndex}
        aria-label="Orientation scenes"
      >
        {Array.from({
          length: SCENE_COUNT,
        }).map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Go to orientation scene ${
              index + 1
            }`}
            aria-current={
              index === scene
                ? "step"
                : undefined
            }
            className={
              index === scene
                ? styles.indexActive
                : undefined
            }
            onClick={() =>
              goTo(index)
            }
          >
            {String(
              index + 1,
            ).padStart(2, "0")}
          </button>
        ))}
      </nav>

      <div
        key={`${scene}-${direction}`}
        className={`${styles.sceneStage} ${
          direction ===
          "forward"
            ? styles.enterForward
            : styles.enterBackward
        }`}
      >
        {scene === 0 ? (
          <ArrivalScene
            participant={
              participant
            }
          />
        ) : null}

        {scene === 1 ? (
          <ContinuityScene />
        ) : null}

        {scene === 2 ? (
          <MatterScene />
        ) : null}

        {scene === 3 ? (
          <EntryScene
            onEnter={completeAndEnter}
            entering={entering}
            entryError={entryError}
          />
        ) : null}
      </div>

      <footer
        className={
          styles.sceneControls
        }
      >
        <button
          type="button"
          onClick={previous}
          disabled={scene === 0}
        >
          ← Previous
        </button>

        <span>
          {String(
            scene + 1,
          ).padStart(2, "0")}
          {" / "}
          {String(
            SCENE_COUNT,
          ).padStart(2, "0")}
        </span>

        {scene <
        SCENE_COUNT - 1 ? (
          <button
            type="button"
            onClick={next}
            className={
              styles.nextButton
            }
          >
            Continue →
          </button>
        ) : (
          <button
            type="button"
            onClick={completeAndEnter}
            disabled={entering}
            className={styles.nextButton}
            aria-live="polite"
          >
            {entering
              ? "Entering…"
              : entryError
                ? "Entrance unavailable · Retry"
                : <>Enter <span className={styles.institutionName}>FRENCH-WARD</span> →</>}
          </button>
        )}
      </footer>
    </main>
  );
}

function ArrivalScene({
  participant,
}: {
  participant: Participant;
}) {
  return (
    <section
      className={`${styles.scene} ${styles.arrivalScene}`}
    >
      <div
        className={
          styles.arrivalCopy
        }
      >
        <p
          className={
            styles.eyebrow
          }
        >
          Institutional
          orientation
        </p>

        <h1>
          Welcome to
          <br />
          <span className={styles.institutionName}>FRENCH-WARD</span>.
        </h1>

        <p
          className={styles.lead}
        >
          You are entering the{" "}
          <span className={styles.institutionName}>FRENCH-WARD</span> workspace
          inside AXPT.
        </p>

        <p
          className={styles.quiet}
        >
          This environment holds
          the work as it actually
          lives: people, matters,
          records, movement and
          action.
        </p>
      </div>

      <div
        className={
          styles.identityField
        }
      >
        <div
          className={
            styles.identityGlow
          }
          aria-hidden="true"
        />

        <p
          className={
            styles.identityKicker
          }
        >
          You are known here
        </p>

        <h2>
          {participant.name}
        </h2>

        <p
          className={
            styles.identityTitle
          }
        >
          {
            participant.institutionalTitle
          }
        </p>

        {participant.secondaryTitle ? (
          <p
            className={
              styles.identitySecondary
            }
          >
            {
              participant.secondaryTitle
            }
          </p>
        ) : null}

        {participant.reference ? (
          <p
            className={
              styles.reference
            }
          >
            {participant.reference}
          </p>
        ) : null}

        <div
          className={
            styles.interfaceStatement
          }
        >
          <span>AXPT</span>
          receives the work and
          keeps its continuity.
        </div>
      </div>
    </section>
  );
}

function ContinuityScene() {
  const modules = [
    [
      "People",
      "Who is involved and what responsibility they carry.",
    ],
    [
      "Matters",
      "Where commercial work stands in its actual passage.",
    ],
    [
      "Records",
      "What has been received, stated and preserved.",
    ],
    [
      "Documents",
      "What has been issued, reviewed or remains outstanding.",
    ],
    [
      "Actions",
      "What may now be done, by whom, and under what authority.",
    ],
  ] as const;

  return (
    <section
      className={`${styles.scene} ${styles.continuityScene}`}
    >
      <div>
        <p
          className={
            styles.eyebrow
          }
        >
          How the work is held
        </p>

        <h1>
          The work does not
          <br />
          live in pieces.
        </h1>

        <p
          className={styles.lead}
        >
          <span className={styles.institutionName}>FRENCH-WARD</span> work is
          held as connected
          institutional context.
        </p>

        <p
          className={
            styles.continuityStatement
          }
        >
          Human beings carry
          judgment.
          <br />
          <strong>
            AXPT carries
            continuity.
          </strong>
        </p>
      </div>

      <div
        className={
          styles.moduleRail
        }
      >
        {modules.map(
          (
            [
              name,
              description,
            ],
            index,
          ) => (
            <div
              className={
                styles.moduleRow
              }
              key={name}
            >
              <span
                className={
                  styles.moduleNumber
                }
              >
                {String(
                  index + 1,
                ).padStart(
                  2,
                  "0",
                )}
              </span>

              <strong>
                {name}
              </strong>

              <p>
                {description}
              </p>
            </div>
          ),
        )}

        <p
          className={
            styles.railFooter
          }
        >
          Nothing here should
          have to be remembered
          in fragments.
        </p>
      </div>
    </section>
  );
}

function MatterScene() {
  return (
    <section
      className={`${styles.scene} ${styles.matterScene}`}
    >
      <div>
        <p
          className={
            styles.eyebrow
          }
        >
          Current example
        </p>

        <h1>
          A matter is where
          <br />
          the work gathers.
        </h1>

        <p
          className={styles.lead}
        >
          You will not enter an
          empty system.
        </p>

        <p
          className={styles.quiet}
        >
          You will enter a live
          institutional field
          where work may already
          be underway.
        </p>
      </div>

      <article
        className={
          styles.matterCard
        }
      >
        <header
          className={
            styles.matterHeader
          }
        >
          <div>
            <p>
              <span className={styles.institutionName}>FRENCH-WARD</span> matter
            </p>

            <h2>
              ZKKM · 50 KG Trial
            </h2>
          </div>

          <span
            className={
              styles.activeBadge
            }
          >
            Active
          </span>
        </header>

        <div
          className={
            styles.matterGrid
          }
        >
          <MatterBlock
            label="People"
          >
            <dl>
              <div>
                <dt>Buyer</dt>
                <dd>
                  ZKKM Bullion
                  Trading FZCO
                </dd>
              </div>

              <div>
                <dt>
                  Originator
                </dt>
                <dd>Mark</dd>
              </div>

              <div>
                <dt>
                  Representative
                </dt>
                <dd>Enver</dd>
              </div>
            </dl>
          </MatterBlock>

          <MatterBlock
            label="Current position"
          >
            <p>
              Trial matter
              recognized. Buyer
              requests Custodian
              Mandate and
              Contract.
            </p>
          </MatterBlock>

          <MatterBlock
            label="Commercial frame"
          >
            <dl>
              <div>
                <dt>Trial</dt>
                <dd>50 KG</dd>
              </div>

              <div>
                <dt>
                  After trial
                </dt>
                <dd>
                  100 KG monthly
                  minimum
                </dd>
              </div>
            </dl>
          </MatterBlock>

          <MatterBlock
            label="Open attention"
          >
            <p>
              Determine the next
              <span className={styles.institutionName}>FRENCH-WARD</span>
              institutional
              response to the
              requested mandate
              and contract.
            </p>
          </MatterBlock>
        </div>

        <footer
          className={
            styles.matterFooter
          }
        >
          <span>
            Return to the matter.
          </span>

          <strong>
            Continue from the
            current state.
          </strong>
        </footer>
      </article>
    </section>
  );
}

function MatterBlock({
  label,
  children,
}: {
  label: string;
  children:
    React.ReactNode;
}) {
  return (
    <section
      className={
        styles.matterBlock
      }
    >
      <p
        className={
          styles.blockLabel
        }
      >
        {label}
      </p>

      {children}
    </section>
  );
}

function EntryScene({
  onEnter,
  entering,
  entryError,
}: {
  onEnter: () => void;
  entering: boolean;
  entryError: boolean;
}) {
  return (
    <section
      className={`${styles.scene} ${styles.entryScene}`}
    >
      <div
        className={
          styles.entryMessage
        }
      >
        <p
          className={
            styles.eyebrow
          }
        >
          You are ready
        </p>

        <h1>
          You are here.
          <br />
          The work is held.
        </h1>

        <p
          className={
            styles.entryLead
          }
        >
          <span className={styles.institutionName}>FRENCH-WARD</span> is already
          organized around the
          people, matters,
          records and
          responsibilities you
          carry.
        </p>

        <p
          className={
            styles.entryReassurance
          }
        >
          You do not need to
          hold everything at
          once.
        </p>
      </div>

      <div
        className={
          styles.entryThreshold
        }
      >
        <div
          className={
            styles.directionLine
          }
          aria-hidden="true"
        >
          <span />
        </div>

        <button
          type="button"
          onClick={onEnter}
          disabled={entering}
          className={styles.enterWorkspace}
          aria-live="polite"
        >
          <span>
            {entering
              ? "Entering…"
              : entryError
                ? "Entrance unavailable · Retry"
                : <>Enter <span className={styles.institutionName}>FRENCH-WARD</span></>}
          </span>
          <span
            className={styles.entryArrow}
            aria-hidden="true"
          >
            →
          </span>
        </button>

        <div
          className={
            styles.entryAssurance
          }
        >
          <p>
            Your place is known.
          </p>

          <p>
            The current work is
            waiting.
          </p>

          <strong>
            Orientation complete
          </strong>
        </div>
      </div>
    </section>
  );
}
