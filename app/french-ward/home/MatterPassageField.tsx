import type {
  FrenchWardHomeMatter,
} from "@/domains/institutions/french-ward/home/contracts";

import styles from "./home.module.css";

type Props = {
  matters: FrenchWardHomeMatter[];
  attentionCount: number;
  movementCount: number;
};

const PASSAGE = [
  { key: "SETTLEMENT", states: ["SETTLEMENT_PENDING", "SETTLED"] },
  { key: "ASSAY", states: ["REFINERY_ASSAY", "ASSAY_PENDING"] },
  { key: "REFINERY", states: ["REFINERY_INTAKE"] },
  { key: "TRANSIT", states: ["IN_TRANSIT"] },
  { key: "EXPORT", states: ["EXPORT_RELEASED", "EXPORT_ACTIVE"] },
  { key: "TREASURY", states: ["TREASURY_PENDING"] },
  { key: "ESCROW", states: ["ESCROW_PENDING", "ESCROW_FUNDED"] },
  { key: "SPA", states: ["SPA_DRAFTING", "SPA_EXECUTED"] },
  { key: "KYC", states: ["KYC_REVIEW"] },
  { key: "INTAKE", states: ["INTAKE_PENDING"] },
] as const;

function passageIndex(
  matter: FrenchWardHomeMatter,
) {
  if (
    matter.recordKind === "INTAKE" &&
    matter.stage === "RECEIVED"
  ) {
    return PASSAGE.findIndex(
      (level) => level.key === "INTAKE",
    );
  }

  return PASSAGE.findIndex((level) =>
    level.states.some(
      (candidate) =>
        candidate === matter.state,
    ),
  );
}

function dateTick(daysAgo: number) {
  const value = new Date();

  value.setDate(
    value.getDate() - daysAgo,
  );

  return value
    .toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    })
    .toUpperCase();
}

export default function MatterPassageField({
  matters,
  attentionCount,
  movementCount,
}: Props) {
  const ticks = [
    dateTick(30),
    dateTick(20),
    dateTick(10),
    dateTick(0),
  ];

  return (
    <section
      className={styles.passage}
      aria-labelledby="matter-passage-title"
    >
      <header className={styles.instrumentHead}>
        <div className={styles.instrumentIdentity}>
          <p className={styles.micro}>
            FIELD / PASSAGE
          </p>

          <h2 id="matter-passage-title">
            Matter Passage
          </h2>

          <p className={styles.instrumentGuide}>
            Where active French-Ward matters stand as they
            move from intake toward settlement.
          </p>
        </div>

        <div
          className={styles.instrumentStrip}
          aria-label="French-Ward field readout"
        >
          <div>
            <span>FIELD</span>
            <strong>
              {matters.length
                .toString()
                .padStart(2, "0")}
            </strong>
          </div>

          <div>
            <span>OPEN</span>
            <strong>
              {matters.length
                .toString()
                .padStart(2, "0")}
            </strong>
          </div>

          <div>
            <span>ATTENTION</span>
            <strong>
              {attentionCount
                .toString()
                .padStart(2, "0")}
            </strong>
          </div>

          <div>
            <span>MOVEMENT</span>
            <strong>
              {movementCount === 0
                ? "—"
                : movementCount
                    .toString()
                    .padStart(2, "0")}
            </strong>
          </div>

          <div>
            <span>AS OF</span>
            <strong>
              {ticks[3]}
            </strong>
          </div>
        </div>
      </header>

      <div className={styles.instrumentField}>
        <div
          className={styles.fwSeal}
          aria-hidden="true"
        >
          <img
            src="/FW/french-ward_V3.2.png"
            alt=""
          />
        </div>

        <div
          className={styles.fieldCoordinates}
          aria-hidden="true"
        >
          <span>POSITION</span>
          <span>TIME / RECORDED PASSAGE</span>
        </div>

        <div className={styles.passageLevels}>
          {PASSAGE.map((level) => (
            <div
              className={styles.passageLevel}
              key={level.key}
            >
              <span className={styles.levelLabel}>
                {level.key}
              </span>

              <span className={styles.levelLine} />
            </div>
          ))}
        </div>

        <div
          className={styles.verticalTicks}
          aria-hidden="true"
        >
          <i />
          <i />
          <i />
          <i />
        </div>

        <div
          className={styles.timeTicks}
          aria-hidden="true"
        >
          {ticks.map((tick) => (
            <span key={tick}>
              {tick}
            </span>
          ))}
        </div>

        {matters.length === 0 ? (
          <div className={styles.emptyField}>
            <span
              className={styles.registrationMark}
              aria-hidden="true"
            />

            <p>
              NO RECORDED PASSAGE
            </p>
          </div>
        ) : (
          <div className={styles.currentPositions}>
            {matters.map((matter, index) => {
              const level =
                passageIndex(matter);

              if (level < 0) {
                return null;
              }

              const top =
                ((level + 0.5) /
                  PASSAGE.length) *
                100;

              const left =
                62 + ((index % 4) * 7);

              const buyer =
                matter.parties.find(
                  (party) =>
                    party.role ===
                    "BUYER",
                );

              const introduction =
                matter.parties.find(
                  (party) =>
                    party.role ===
                    "INTRODUCTION_CHANNEL",
                );

              return (
                <div
                  className={styles.position}
                  key={matter.id}
                  style={{
                    top: `${top}%`,
                    left: `${left}%`,
                  }}
                  tabIndex={0}
                  aria-label={`${PASSAGE[level].key}: ${matter.title}`}
                >
                  <span
                    className={
                      styles.positionNode
                    }
                    aria-hidden="true"
                  />

                  <div
                    className={
                      styles.positionSummary
                    }
                  >
                    <strong
                      className={
                        styles.positionLabel
                      }
                    >
                      {PASSAGE[level].key}
                    </strong>

                    <span
                      className={
                        styles.positionBuyer
                      }
                    >
                      {buyer?.legalName ??
                        matter.title}
                    </span>

                    {introduction ? (
                      <small
                        className={
                          styles.positionRelation
                        }
                      >
                        Introduction ·{" "}
                        {
                          introduction
                            .legalName
                        }
                      </small>
                    ) : null}
                  </div>

                  <div
                    className={
                      styles.positionDetail
                    }
                  >
                    <small>
                      {matter.title}
                    </small>

                    <code>
                      {matter.reference}
                    </code>

                    <small
                      className={
                        styles.positionLifecycle
                      }
                    >
                      {matter.stage}
                      {" · "}
                      {matter.state}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className={styles.instrumentFoot}>
        <span>
          EXISTENCE / MATTER
        </span>

        <span>
          SOURCE / CANONICAL RECORD
        </span>

        <span>
          PASSAGE / SYSTEM
        </span>
      </footer>
    </section>
  );
}
