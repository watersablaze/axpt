"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import type {
  FrenchWardHomeActionPosture,
  FrenchWardHomeProjection,
} from "@/domains/institutions/french-ward/home/contracts";

import SendLoiAction from "./actions/SendLoiAction";
import RegisterBuyerTransactionAction from "./actions/RegisterBuyerTransactionAction";

import MatterPassageField from "./MatterPassageField";
import styles from "./home.module.css";
import refinement from "./home-refinement.module.css";

type Props = {
  home: FrenchWardHomeProjection;
  actions: FrenchWardHomeActionPosture;
  initialModule?: ModuleId;
};

type ModuleId =
  | "home"
  | "matters"
  | "records"
  | "documents"
  | "people"
  | "actions";

type ActionViewId =
  | "send-loi"
  | "register-buyer-transaction"
  | "promote-intake";

const MODULES: readonly {
  index: string;
  id: ModuleId;
  label: string;
  descriptor: string;
}[] = [
  {
    index: "01",
    id: "home",
    label: "Home",
    descriptor: "Home base for active stewardship and execution",
  },
  {
    index: "02",
    id: "matters",
    label: "Matters",
    descriptor: "Transactions and active work",
  },
  {
    index: "03",
    id: "records",
    label: "Records",
    descriptor: "Recorded institutional movement",
  },
  {
    index: "04",
    id: "documents",
    label: "Documents",
    descriptor: "Documentary material",
  },
  {
    index: "05",
    id: "people",
    label: "People",
    descriptor: "Recognized institutional presence",
  },
  {
    index: "06",
    id: "actions",
    label: "Actions",
    descriptor: "Authorized institutional execution",
  },
];

function humanize(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) => letter.toUpperCase(),
    );
}

export default function HomeWorkspaceShell({
  home,
  actions,
  initialModule = "home",
}: Props) {
  const [activeModule, setActiveModule] =
    useState<ModuleId>(initialModule);

  const [awarenessOpen, setAwarenessOpen] =
    useState(false);

  const [
    activeAction,
    setActiveAction,
  ] = useState<ActionViewId>(
    "send-loi",
  );

  const currentModule =
    MODULES.find(
      (module) => module.id === activeModule,
    ) ?? MODULES[0];

  const people = useMemo(() => {
    const entries = new Map<
      string,
      {
        role: string;
        legalName: string;
      }
    >();

    for (const matter of home.matters) {
      for (const party of matter.parties) {
        const key =
          `${party.role}:${party.legalName}`;

        if (!entries.has(key)) {
          entries.set(key, party);
        }
      }
    }

    return [...entries.values()];
  }, [home.matters]);

  const latestMovement =
    home.recentMovement[0] ?? null;

  const [
    matterView,
    setMatterView,
  ] = useState<
    | "ALL"
    | "INTAKE"
    | "OPPORTUNITY"
    | "DOSSIER"
    | "ATTENTION"
  >("ALL");

  const visibleMatters = useMemo(
    () =>
      home.matters.filter((matter) => {
        if (matterView === "ALL") {
          return true;
        }

        if (matterView === "ATTENTION") {
          return (
            matter.pendingAttentionCount > 0
          );
        }

        return (
          matter.recordKind === matterView
        );
      }),
    [home.matters, matterView],
  );

  const [
    recordView,
    setRecordView,
  ] = useState<
    | "ALL"
    | "INTAKE"
    | "OPPORTUNITY"
    | "DOSSIER"
  >("ALL");

  const visibleRecordMovements =
    useMemo(
      () =>
        home.recentMovement.filter(
          (movement) =>
            recordView === "ALL" ||
            movement.sourceRecord.kind ===
              recordView,
        ),
      [
        home.recentMovement,
        recordView,
      ],
    );

  const groupedRecordMovements =
    useMemo(() => {
      const groups = new Map<
        string,
        {
          matterId: string;
          matterReference: string;
          matterTitle: string;
          movements: typeof visibleRecordMovements;
        }
      >();

      for (const movement of
        visibleRecordMovements) {
        const existing = groups.get(
          movement.matterId,
        );

        if (existing) {
          existing.movements.push(
            movement,
          );
          continue;
        }

        groups.set(movement.matterId, {
          matterId: movement.matterId,
          matterReference:
            movement.matterReference,
          matterTitle:
            movement.matterTitle,
          movements: [movement],
        });
      }

      return [...groups.values()].map(
        group => ({
          ...group,
          movements: [...group.movements].sort(
            (a, b) =>
              new Date(
                b.occurredAt,
              ).getTime() -
              new Date(
                a.occurredAt,
              ).getTime(),
          ),
        }),
      );
    }, [visibleRecordMovements]);

  const [
    openRecordMatters,
    setOpenRecordMatters,
  ] = useState<Set<string>>(
    () => new Set(),
  );

  function toggleRecordMatter(
    matterId: string,
  ) {
    setOpenRecordMatters(current => {
      const next = new Set(current);

      if (next.has(matterId)) {
        next.delete(matterId);
      } else {
        next.add(matterId);
      }

      return next;
    });
  }

  function selectModule(
    module: ModuleId,
  ) {
    setActiveModule(module);
  }

  return (
    <main
      className={`${styles.workspace} ${
        awarenessOpen
          ? styles.awarenessOpen
          : styles.awarenessClosed
      }`}
    >
      <header
        className={
          styles.workspaceCrown
        }
      >
        <div
          className={
            styles.workspaceCrownBrand
          }
        >
          <strong>
            FRENCH-WARD
          </strong>

          <span>INC.</span>
        </div>

        <div
          className={
            styles.workspaceCrownIdentity
          }
        >
          HOME WORKSPACE
        </div>

        <div
          className={
            styles.workspaceCrownOperator
          }
        >
          <div
            className={
              styles.workspaceOperatorIdentity
            }
          >
            <span>
              {
                home.participant
                  .name
              }
            </span>

            <small>
              {
                home.participant
                  .institutionalTitle
              }
            </small>

            {home.participant
              .reference ? (
                <code>
                  {
                    home.participant
                      .reference
                  }
                </code>
              ) : null}
          </div>

          <form
            action="/api/auth/clear-session"
            method="post"
            className={
              styles.workspaceSignOut
            }
          >
            <button
              type="submit"
            >
              SIGN OUT
            </button>
          </form>
        </div>
      </header>

      <aside
        className={styles.leftRail}
        aria-label="French-Ward institutional presence"
      >
        <div
          className={
            styles.railEthos
          }
          data-rail="stewardship"
        >
          <span>
            STEWARDSHIP / PRESENCE
          </span>

          <strong>
            Stewards of Sovereign Wealth
          </strong>

          <p>
            Stewardship precedes execution.
            Authority remains attributable.
          </p>
        </div>
        <div
          className={
            styles.institutionBrand
          }
        >
          <img
            src="/FW/french-ward_V3.2.png"
            alt=""
            aria-hidden="true"
            className={
              styles.brandSeal
            }
          />

          <div className={styles.wordmark}>
            <strong>FRENCH-WARD</strong>
            <span>INC.</span>
          </div>
        </div>

        <section className={styles.participant} data-capacity-card="true">
          <p className={styles.micro}>
            PRESENT / CAPACITY
          </p>

          <h2 className={styles.participantName}>
            {home.participant.name}
          </h2>

          <p className={styles.participantRole}>
            {home.participant.institutionalTitle}

            {home.participant.secondaryTitle ? (
              <>
                <br />
                {
                  home.participant
                    .secondaryTitle
                }
              </>
            ) : null}
          </p>

          {home.participant.reference ? (
            <code
              className={
                styles.participantReference
              }
            >
              {home.participant.reference}
            </code>
          ) : null}
        </section>

        <nav
          className={styles.directory}
          aria-label="French-Ward Home modules"
        >
          <p className={styles.micro}>
            INSTITUTION
          </p>

          <ul>
            {MODULES.map((module) => {
              const active =
                activeModule === module.id;

              return (
                <li key={module.id}>
                  <button
                    type="button"
                    className={
                      styles.directoryLink
                    }
                    data-active={
                      active
                        ? "true"
                        : "false"
                    }
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                    onClick={() =>
                      selectModule(
                        module.id,
                      )
                    }
                  >
                    <span
                      className={
                        styles.directoryIndex
                      }
                    >
                      {module.index}
                    </span>

                    <span>
                      {module.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.railFoot}>
          <div>
            HOME / INSTITUTIONAL FIELD
          </div>
          <div>
            AXPT LOCAL / CONTINUITY ACTIVE
          </div>
        </div>
      </aside>

      <section className={styles.center}>
        <div className={styles.centerInner}>
          <header
            className={styles.centerHead}
          >
            <div>
              <p className={styles.micro}>
                {currentModule.index}
                {" / "}
                {currentModule.label.toUpperCase()}
              </p>

              <h1>
                {currentModule.label ===
                "Home"
                  ? "Home Desk"
                  : currentModule.label}
              </h1>

              <p
                className={
                  styles.workspaceLead
                }
              >
                {
                  currentModule.descriptor
                }
              </p>
            </div>

            <button
              type="button"
              className={`${styles.awarenessToggle} ${refinement.awarenessEntry}`}
              aria-label={awarenessOpen
                ? "Close Awareness Panel"
                : "Open Awareness Panel"}
              aria-expanded={
                awarenessOpen
              }
              aria-controls="fw-awareness-rail"
              onClick={() =>
                setAwarenessOpen(
                  (open) => !open,
                )
              }
            >
              <span>
                {awarenessOpen
                  ? "CLOSE AWARENESS PANEL"
                  : "OPEN AWARENESS PANEL"}
              </span>

              <strong aria-hidden="true">
                {awarenessOpen ? "×" : "↗"}
              </strong>
            </button>
          </header>

          {activeModule === "home" ? (
            <section
              className={
                styles.moduleStage
              }
              aria-label="French-Ward Home"
            >
              <MatterPassageField
                matters={home.matters}
                attentionCount={
                  home.attention.length
                }
                movementCount={
                  home.recentMovement
                    .length
                }
              />

              <section
                className={
                  styles.nowField
                }
                aria-labelledby="now-title"
              >
                <header
                  className={
                    styles.moduleSubhead
                  }
                >
                  <div>
                    <p
                      className={
                        styles.micro
                      }
                    >
                      RIGHT NOW
                    </p>

                    <h2 id="now-title">
                      Institutional Snapshot
                    </h2>
                  </div>

                  <span>
                    CURRENT
                  </span>
                </header>

                <div
                  className={
                    styles.nowGrid
                  }
                >
                  <article
                    className={
                      styles.nowCell
                    }
                  >
                    <span>
                      ACTIVE MATTERS
                    </span>
                    <strong>
                      {home.matters.length
                        .toString()
                        .padStart(2, "0")}
                    </strong>
                    <p>
                      Transactions presently
                      carried in the field.
                    </p>
                  </article>

                  <article
                    className={
                      styles.nowCell
                    }
                  >
                    <span>
                      ATTENTION
                    </span>
                    <strong
                      data-tone={
                        home.attention
                          .length > 0
                          ? "attention"
                          : "quiet"
                      }
                    >
                      {home.attention.length
                        .toString()
                        .padStart(2, "0")}
                    </strong>
                    <p>
                      Conditions currently
                      requiring awareness.
                    </p>
                  </article>

                  <article
                    className={
                      styles.nowCell
                    }
                  >
                    <span>
                      LAST MOVEMENT
                    </span>

                    <strong
                      className={
                        styles.nowMovementTitle
                      }
                      data-tone="movement"
                    >
                      {latestMovement
                        ? latestMovement
                            .matterTitle
                        : "—"}
                    </strong>

                    <p
                      className={
                        styles.nowMovementMessage
                      }
                    >
                      {latestMovement
                        ? latestMovement.message
                        : "No recorded matter movement is present yet."}
                    </p>

                    {latestMovement ? (
                      <small
                        className={
                          styles.nowMovementMeta
                        }
                      >
                        {new Date(
                          latestMovement.occurredAt,
                        ).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                        {" · "}
                        {
                          latestMovement
                            .sourceRecord
                            .kind
                        }
                      </small>
                    ) : null}
                  </article>
                </div>
              </section>

              <section
                className={
                  styles.transactionPreview
                }
                aria-labelledby="transaction-snapshot-title"
              >
                <header
                  className={
                    styles.moduleSubhead
                  }
                >
                  <div>
                    <p
                      className={
                        styles.micro
                      }
                    >
                      TRANSACTION FIELD
                    </p>

                    <h2
                      id="transaction-snapshot-title"
                    >
                      Record Snapshot
                    </h2>
                  </div>

                  <button
                    type="button"
                    className={
                      styles.inlineModuleAction
                    }
                    onClick={() =>
                      selectModule(
                        "matters",
                      )
                    }
                  >
                    VIEW MATTERS →
                  </button>
                </header>

                {home.matters[0] ? (
                  <article
                    className={
                      styles.snapshotMatter
                    }
                  >
                    <div
                      className={
                        styles.snapshotMatterIdentity
                      }
                    >
                      <div
                        className={
                          styles.snapshotMatterHeading
                        }
                      >
                        <span>
                          CURRENT MATTER
                        </span>

                        <code>
                          {
                            home.matters[0]
                              .reference
                          }
                        </code>
                      </div>

                      <h3>
                        {
                          home.matters[0]
                            .title
                        }
                      </h3>

                      <p>
                        {
                          home.matters[0]
                            .lastMovement
                            ?.message ??
                          "No recorded movement"
                        }
                      </p>
                    </div>

                    <dl>
                      <div>
                        <dt>
                          Lifecycle
                        </dt>
                        <dd>
                          {humanize(
                            home.matters[0]
                              .stage,
                          )}
                          {" · "}
                          {humanize(
                            home.matters[0]
                              .state,
                          )}
                          {" · "}
                          {home.matters[0]
                            .recordKind}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Commodity
                        </dt>
                        <dd>
                          {home.matters[0]
                            .commodity ??
                            "—"}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Quantity
                        </dt>
                        <dd>
                          {home.matters[0]
                            .quantityKg ??
                            "—"}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ) : (
                  <div
                    className={
                      styles.emptyModuleState
                    }
                  >
                    No active transaction
                    record is currently
                    projected into Home.
                  </div>
                )}
              </section>
            </section>
          ) : null}

          {activeModule ===
          "matters" ? (
            <section
              className={
                styles.moduleStage
              }
              aria-labelledby="matters-title"
            >
              <header
                className={
                  styles.moduleIntro
                }
              >
                <p
                  className={
                    styles.moduleGuide
                  }
                >
                  The institutional field of
                  undertakings presently carried
                  by French-Ward. Matter identity
                  remains continuous as its
                  transaction record progresses.
                </p>
              </header>

              <section
                className={
                  styles.mattersSummary
                }
                aria-label="Matter field summary"
              >
                <header
                  className={
                    styles.mattersSummaryHead
                  }
                >
                  <div>
                    <p
                      className={
                        styles.micro
                      }
                    >
                      FIELD SUMMARY
                    </p>

                    <h2 id="matters-title">
                      Matters
                    </h2>
                  </div>

                  <span>
                    {home.matters.length
                      .toString()
                      .padStart(2, "0")}
                    {" / PRESENT"}
                  </span>
                </header>

                <div
                  className={
                    styles.matterMetrics
                  }
                  role="group"
                  aria-label="Filter Matter field"
                >
                  {[
                    {
                      key: "ALL" as const,
                      label: "ALL",
                      value:
                        home.matters.length,
                    },
                    {
                      key: "INTAKE" as const,
                      label: "INTAKE",
                      value:
                        home.matters.filter(
                          matter =>
                            matter.recordKind ===
                            "INTAKE",
                        ).length,
                    },
                    {
                      key:
                        "OPPORTUNITY" as const,
                      label: "OPPORTUNITY",
                      value:
                        home.matters.filter(
                          matter =>
                            matter.recordKind ===
                            "OPPORTUNITY",
                        ).length,
                    },
                    {
                      key: "DOSSIER" as const,
                      label: "DOSSIER",
                      value:
                        home.matters.filter(
                          matter =>
                            matter.recordKind ===
                            "DOSSIER",
                        ).length,
                    },
                    {
                      key:
                        "ATTENTION" as const,
                      label: "ATTENTION",
                      value:
                        home.attention.length,
                    },
                  ].map(item => (
                    <button
                      key={item.key}
                      type="button"
                      className={
                        styles.matterMetric
                      }
                      data-active={
                        matterView === item.key
                          ? "true"
                          : "false"
                      }
                      data-tone={
                        item.key ===
                          "ATTENTION" &&
                        item.value > 0
                          ? "attention"
                          : "quiet"
                      }
                      aria-pressed={
                        matterView === item.key
                      }
                      onClick={() =>
                        setMatterView(item.key)
                      }
                    >
                      <span>
                        {item.label}
                      </span>

                      <strong>
                        {item.value
                          .toString()
                          .padStart(2, "0")}
                      </strong>

                      <small>
                        {item.key === "ALL"
                          ? "field"
                          : item.key ===
                              "ATTENTION"
                            ? "review"
                            : "record"}
                      </small>
                    </button>
                  ))}
                </div>
              </section>

              <section
                className={
                  styles.matterFieldLedger
                }
                aria-labelledby="active-matters-title"
              >
                <header
                  className={
                    styles.matterFieldHead
                  }
                >
                  <div>
                    <p
                      className={
                        styles.micro
                      }
                    >
                      ACTIVE FIELD
                    </p>

                    <h3 id="active-matters-title">
                      Current positions
                    </h3>

                    <p
                      className={
                        styles.sectionGuide
                      }
                    >
                      Present position, record
                      family and last recorded
                      movement for each Matter.
                    </p>
                  </div>

                  <span>
                    CONTINUITY / POSITION
                  </span>
                </header>

                <div
                  className={
                    styles.matterColumnHead
                  }
                  aria-hidden="true"
                >
                  <span>MATTER</span>
                  <span>POSITION</span>
                  <span>LAST MOVEMENT</span>
                  <span>ATTENTION</span>
                </div>

                {visibleMatters.length ===
                0 ? (
                  <div
                    className={
                      styles.emptyLedger
                    }
                  >
                    <strong>
                      No Matters in this view.
                    </strong>

                    <span>
                      {matterView === "ALL"
                        ? "Institutional Matters will appear here as commercial undertakings are recorded."
                        : matterView ===
                            "ATTENTION"
                          ? "Conditions requiring institutional review will surface here when present."
                          : `${matterView.charAt(
                              0,
                            )}${matterView
                              .slice(1)
                              .toLowerCase()} records will appear here when a Matter occupies this transaction position.`}
                    </span>
                  </div>
                ) : (
                  visibleMatters.map(
                    (matter) => {
                      const buyer =
                        matter.parties.find(
                          party =>
                            party.role ===
                            "BUYER",
                        );

                      return (
                        <article
                          className={
                            styles.matterLedgerRow
                          }
                          key={matter.id}
                        >
                          <div
                            className={
                              styles.matterIdentity
                            }
                          >
                            <div
                              className={
                                styles.matterIdentityTop
                              }
                            >
                              <span>
                                {
                                  matter.recordKind
                                }
                              </span>

                              <code>
                                {
                                  matter.reference
                                }
                              </code>
                            </div>

                            <strong>
                              {matter.title}
                            </strong>

                            {buyer ? (
                              <small>
                                Buyer ·{" "}
                                {
                                  buyer.legalName
                                }
                              </small>
                            ) : (
                              <small>
                                Institutional Matter
                              </small>
                            )}

                            <div
                              className={
                                styles.matterMaterial
                              }
                            >
                              {matter.commodity ? (
                                <span>
                                  {
                                    matter.commodity
                                  }
                                </span>
                              ) : null}

                              {matter.quantityKg ? (
                                <span>
                                  {
                                    matter.quantityKg
                                  }
                                  {" kg"}
                                </span>
                              ) : null}

                              {matter.origin ? (
                                <span>
                                  {
                                    matter.origin
                                  }
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div
                            className={
                              styles.matterPosition
                            }
                          >
                            <p
                              className={
                                styles.micro
                              }
                            >
                              LIFECYCLE
                            </p>

                            <strong
                              className={
                                styles.matterStage
                              }
                            >
                              {humanize(
                                matter.stage,
                              )}
                            </strong>

                            <small>
                              {humanize(
                                matter.state,
                              )}
                            </small>

                            <span
                              className={
                                styles.matterRecordBadge
                              }
                            >
                              {
                                matter.recordKind
                              }
                            </span>
                          </div>

                          <div
                            className={
                              styles.matterMovement
                            }
                          >
                            <p>
                              {matter.lastMovement
                                ?.message ??
                                "No recorded movement"}
                            </p>

                            {matter.lastMovement ? (
                              <small>
                                {new Date(
                                  matter
                                    .lastMovement
                                    .occurredAt,
                                ).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                                {" · "}
                                {
                                  matter
                                    .lastMovement
                                    .sourceRecord
                                    .kind
                                }
                              </small>
                            ) : null}
                          </div>

                          <div
                            className={
                              styles.matterAction
                            }
                          >
                            <div
                              className={
                                styles.matterAttention
                              }
                              data-tone={
                                matter
                                  .pendingAttentionCount >
                                0
                                  ? "attention"
                                  : "quiet"
                              }
                            >
                              <strong>
                                {matter
                                  .pendingAttentionCount
                                  .toString()
                                  .padStart(2, "0")}
                              </strong>

                              <span>
                                {matter
                                  .pendingAttentionCount ===
                                1
                                  ? "condition"
                                  : "conditions"}
                              </span>
                            </div>

                            {matter.reference.startsWith(
                              "AXPT-MAT-",
                            ) ? (
                              <Link
                                className={
                                  styles.openMatter
                                }
                                href={`/french-ward/matters/${encodeURIComponent(
                                  matter.reference,
                                )}`}
                                prefetch={false}
                              >
                                Open Matter →
                              </Link>
                            ) : (
                              <span
                                className={
                                  styles.matterTransitional
                                }
                              >
                                Transitional record
                              </span>
                            )}
                          </div>
                        </article>
                      );
                    },
                  )
                )}
              </section>

              <aside
                className={
                  styles.matterContinuityRail
                }
                aria-label="Matter record passage"
              >
                <div
                  className={
                    styles.continuityStatement
                  }
                >
                  <span>
                    MATTER CONTINUITY
                  </span>

                  <strong>
                    persists across record passage
                  </strong>
                </div>

                <div
                  className={
                    styles.continuitySequence
                  }
                  aria-hidden="true"
                >
                  {[
                    "INTAKE",
                    "OPPORTUNITY",
                    "DOSSIER",
                  ].map((record, index) => (
                    <div
                      key={record}
                      className={
                        styles.continuityPosition
                      }
                    >
                      <span>
                        {(index + 1)
                          .toString()
                          .padStart(2, "0")}
                      </span>

                      <strong>
                        {record}
                      </strong>

                      {index < 2 ? (
                        <i>→</i>
                      ) : null}
                    </div>
                  ))}
                </div>

                <p>
                  Record position may change.
                  Matter identity remains durable.
                </p>
              </aside>
            </section>
          ) : null}

          {activeModule ===
          "records" ? (
            <section
              className={
                styles.moduleStage
              }
              aria-labelledby="records-title"
            >
              <header
                className={
                  styles.moduleIntro
                }
              >
                <p
                  className={
                    styles.moduleGuide
                  }
                >
                  The recorded institutional
                  movement presently visible to
                  French-Ward: what changed,
                  which Matter carried it, the
                  source record and the actor
                  attributed to the event.
                </p>
              </header>

              <section
                className={
                  styles.recordsDesk
                }
                aria-labelledby="records-title"
              >
                <header
                  className={
                    styles.recordsDeskHead
                  }
                >
                  <div>
                    <p
                      className={
                        styles.micro
                      }
                    >
                      RECORD FIELD
                    </p>

                    <h2 id="records-title">
                      Recorded Movement
                    </h2>
                  </div>

                  <span>
                    {home.recentMovement.length
                      .toString()
                      .padStart(2, "0")}
                    {" / EVENTS"}
                  </span>
                </header>

                <div
                  className={
                    styles.recordControls
                  }
                  role="group"
                  aria-label="Filter institutional records"
                >
                  {[
                    {
                      key: "ALL" as const,
                      label: "ALL",
                      value:
                        home.recentMovement
                          .length,
                    },
                    {
                      key: "INTAKE" as const,
                      label: "INTAKE",
                      value:
                        home.recentMovement
                          .filter(
                            movement =>
                              movement
                                .sourceRecord
                                .kind ===
                              "INTAKE",
                          ).length,
                    },
                    {
                      key:
                        "OPPORTUNITY" as const,
                      label: "OPPORTUNITY",
                      value:
                        home.recentMovement
                          .filter(
                            movement =>
                              movement
                                .sourceRecord
                                .kind ===
                              "OPPORTUNITY",
                          ).length,
                    },
                    {
                      key: "DOSSIER" as const,
                      label: "DOSSIER",
                      value:
                        home.recentMovement
                          .filter(
                            movement =>
                              movement
                                .sourceRecord
                                .kind ===
                              "DOSSIER",
                          ).length,
                    },
                  ].map(item => (
                    <button
                      key={item.key}
                      type="button"
                      className={
                        styles.recordControl
                      }
                      data-active={
                        recordView === item.key
                          ? "true"
                          : "false"
                      }
                      aria-pressed={
                        recordView === item.key
                      }
                      onClick={() =>
                        setRecordView(item.key)
                      }
                    >
                      <span>
                        {item.label}
                      </span>

                      <strong>
                        {item.value
                          .toString()
                          .padStart(2, "0")}
                      </strong>

                      <small>
                        {recordView === item.key
                          ? "ACTIVE"
                          : "VIEW"}
                      </small>
                    </button>
                  ))}
                </div>
              </section>

              <section
                className={
                  styles.institutionalRecord
                }
                aria-label="Institutional movement ledger"
              >
                {groupedRecordMovements.length ===
                0 ? (
                  <div
                    className={
                      styles.recordEmpty
                    }
                  >
                    <strong>
                      No recorded movement in
                      this view.
                    </strong>

                    <span>
                      {recordView === "ALL"
                        ? "Institutional movements will accumulate here as French-Ward Matters generate attributable events."
                        : recordView ===
                            "OPPORTUNITY"
                          ? "Opportunity movements will appear here once that record position projects attributable events into Home."
                          : `${recordView.charAt(
                              0,
                            )}${recordView
                              .slice(1)
                              .toLowerCase()} movements will appear here when recorded.`}
                    </span>
                  </div>
                ) : (
                  groupedRecordMovements.map(
                    (group) => {
                      const isOpen =
                        openRecordMatters.has(
                          group.matterId,
                        );

                      const latest =
                        group.movements[0];

                      const durableMatter =
                        group.matterReference
                          .startsWith(
                            "AXPT-MAT-",
                          );

                      return (
                        <section
                          key={group.matterId}
                          className={
                            styles.recordMatterGroup
                          }
                          data-open={
                            isOpen
                              ? "true"
                              : "false"
                          }
                        >
                          <button
                            type="button"
                            className={
                              styles.recordMatterToggle
                            }
                            aria-expanded={
                              isOpen
                            }
                            onClick={() =>
                              toggleRecordMatter(
                                group.matterId,
                              )
                            }
                          >
                            <div
                              className={
                                styles.recordMatterIdentity
                              }
                            >
                              <span>
                                MATTER
                              </span>

                              <strong>
                                {
                                  group.matterTitle
                                }
                              </strong>

                              <code>
                                {
                                  group.matterReference
                                }
                              </code>
                            </div>

                            <div
                              className={
                                styles.recordMatterSummary
                              }
                            >
                              <span>
                                {
                                  group.movements
                                    .length
                                }{" "}
                                {group.movements
                                  .length === 1
                                  ? "EVENT"
                                  : "EVENTS"}
                              </span>

                              <small>
                                Latest ·{" "}
                                {new Date(
                                  latest.occurredAt,
                                ).toLocaleDateString(
                                  "en-US",
                                  {
                                    month:
                                      "short",
                                    day:
                                      "numeric",
                                    year:
                                      "numeric",
                                  },
                                )}
                              </small>
                            </div>

                            <span
                              className={
                                styles.recordMatterChevron
                              }
                              aria-hidden="true"
                            >
                              {isOpen
                                ? "CLOSE −"
                                : "OPEN +"}
                            </span>
                          </button>

                          {isOpen ? (
                            <div
                              className={
                                styles.recordMatterBody
                              }
                            >
                              <header
                                className={
                                  styles.recordLedgerHead
                                }
                              >
                                <span>WHEN</span>
                                <span>EVENT</span>
                                <span>SOURCE</span>
                                <span>
                                  ACTOR / CHANGE
                                </span>
                              </header>

                              {group.movements.map(
                                movement => (
                                  <article
                                    className={
                                      styles.institutionalRecordRow
                                    }
                                    key={
                                      movement.id
                                    }
                                  >
                                    <div
                                      className={
                                        styles.recordWhen
                                      }
                                    >
                                      <time
                                        dateTime={
                                          movement.occurredAt
                                        }
                                      >
                                        {new Date(
                                          movement.occurredAt,
                                        ).toLocaleDateString(
                                          "en-US",
                                          {
                                            month:
                                              "short",
                                            day:
                                              "numeric",
                                            year:
                                              "numeric",
                                          },
                                        )}
                                      </time>

                                      <small>
                                        {new Date(
                                          movement.occurredAt,
                                        ).toLocaleTimeString(
                                          "en-US",
                                          {
                                            hour:
                                              "2-digit",
                                            minute:
                                              "2-digit",
                                          },
                                        )}
                                      </small>
                                    </div>

                                    <div
                                      className={
                                        styles.recordEvent
                                      }
                                    >
                                      <strong>
                                        {
                                          movement.message
                                        }
                                      </strong>

                                      {durableMatter ? (
                                        <Link
                                          href={`/french-ward/matters/${encodeURIComponent(
                                            group.matterReference,
                                          )}`}
                                          prefetch={
                                            false
                                          }
                                        >
                                          Open Matter →
                                        </Link>
                                      ) : null}
                                    </div>

                                    <div
                                      className={
                                        styles.recordSource
                                      }
                                    >
                                      <span>
                                        {
                                          movement
                                            .sourceRecord
                                            .kind
                                        }
                                      </span>

                                      <code>
                                        {
                                          movement
                                            .sourceRecord
                                            .reference
                                        }
                                      </code>

                                      <small>
                                        Event ·{" "}
                                        {
                                          movement
                                            .sourceEventId
                                        }
                                      </small>
                                    </div>

                                    <div
                                      className={
                                        styles.recordActor
                                      }
                                    >
                                      <strong>
                                        {movement.actor ??
                                          "SYSTEM"}
                                      </strong>

                                      {movement.fromState ||
                                      movement.toState ? (
                                        <span>
                                          {movement
                                            .fromState ??
                                            "—"}
                                          {" → "}
                                          {movement
                                            .toState ??
                                            "—"}
                                        </span>
                                      ) : (
                                        <span>
                                          Recorded event
                                        </span>
                                      )}
                                    </div>
                                  </article>
                                ),
                              )}
                            </div>
                          ) : null}
                        </section>
                      );
                    },
                  )
                )}
              </section>

              <aside
                className={
                  styles.recordBoundary
                }
              >
                <span>
                  RECORD ≠ AUTHORITY
                </span>

                <p>
                  This surface records
                  attributable institutional
                  movement. Presence in the
                  record does not itself confer
                  commercial or governing
                  authority.
                </p>
              </aside>
            </section>
          ) : null}

          {activeModule ===
          "documents" ? (
            <section
              className={
                styles.moduleStage
              }
              aria-labelledby="documents-title"
            >
              <header
                className={
                  styles.moduleIntro
                }
              >
                <p
                  className={
                    styles.moduleGuide
                  }
                >
                  Canonical French-Ward
                  institutional publications
                  available within the current
                  authorized Home posture.
                  Documentary access does not
                  itself confer governing,
                  commercial, instrument or
                  transaction authority.
                </p>
              </header>

              <section
                className={
                  styles.documentsField
                }
                aria-labelledby="documents-title"
              >
                <header
                  className={
                    styles.documentsFieldHead
                  }
                >
                  <div>
                    <p
                      className={
                        styles.micro
                      }
                    >
                      INSTITUTIONAL RESOURCES
                    </p>

                    <h2 id="documents-title">
                      Documents
                    </h2>
                  </div>

                  <span>
                    {home.documents.length
                      .toString()
                      .padStart(2, "0")}
                    {" / AVAILABLE"}
                  </span>
                </header>

                {home.documents.length ===
                0 ? (
                  <div
                    className={
                      styles.documentEmpty
                    }
                  >
                    <strong>
                      No institutional resources
                      are available in this
                      view.
                    </strong>

                    <span>
                      Institutional documents
                      become available here
                      according to current
                      French-Ward standing or
                      administrative review
                      policy.
                    </span>
                  </div>
                ) : (
                  <div
                    className={
                      styles.documentLedger
                    }
                  >
                    {home.documents.map(
                      document => (
                        <article
                          className={
                            styles.documentRow
                          }
                          key={
                            document.reference
                          }
                        >
                          <div
                            className={
                              styles.documentKind
                            }
                          >
                            <span>
                              {document.kind ===
                              "INSTITUTIONAL_PROFILE"
                                ? "INSTITUTION"
                                : "COMMERCIAL PAPER"}
                            </span>

                            <small>
                              VIEW ONLY
                            </small>
                          </div>

                          <div
                            className={
                              styles.documentIdentity
                            }
                          >
                            <strong>
                              {
                                document.title
                              }
                            </strong>

                            <code>
                              {
                                document.reference
                              }
                            </code>
                          </div>

                          <div
                            className={
                              styles.documentVersion
                            }
                          >
                            <span>
                              VERSION
                            </span>

                            <strong>
                              {String(
                                document.version,
                              ).padStart(
                                2,
                                "0",
                              )}
                            </strong>
                          </div>

                          <Link
                            className={
                              styles.openDocument
                            }
                            href={
                              document.href
                            }
                            prefetch={false}
                          >
                            Open →
                          </Link>
                        </article>
                      ),
                    )}
                  </div>
                )}
              </section>

              <aside
                className={
                  styles.documentBoundary
                }
              >
                <span>
                  ACCESS ≠ AUTHORITY
                </span>

                <p>
                  These publications may be
                  read within the governing
                  Home environment. Viewing a
                  publication does not itself
                  authorize presentation,
                  transmission, execution,
                  negotiation or commitment.
                </p>
              </aside>
            </section>
          ) : null}

          {activeModule ===
          "actions" ? (
            <section
              className={`${styles.moduleStage} ${styles.actionsStage}`}
              aria-label="Actions"
            >




              <section
                className={
                  styles.actionPostureField
                }
                aria-label="French-Ward action capability posture"
              >
                <button
                  type="button"
                  className={
                    styles.actionPosture
                  }
                  data-available={
                    actions.sendLoi
                      ? "true"
                      : "false"
                  }
                  data-current={
                    activeAction ===
                    "send-loi"
                      ? "true"
                      : "false"
                  }
                  aria-pressed={
                    activeAction ===
                    "send-loi"
                  }
                  onClick={() =>
                    setActiveAction(
                      "send-loi",
                    )
                  }
                >
                  <div>
                    <span>01</span>

                    <p>
                      COMMERCIAL ENTRY
                    </p>
                  </div>

                  <h3>
                    Send LOI
                  </h3>

                  <strong>
                    {actions.sendLoi
                      ? "AVAILABLE"
                      : "UNAVAILABLE"}
                  </strong>

                  <p>
                    Issue a governed
                    French-Ward commercial
                    intake invitation to a
                    named external recipient.
                  </p>
                </button>

                <button
                  type="button"
                  className={
                    styles.actionPosture
                  }
                  data-available={
                    actions.registerBuyerTransaction
                      ? "true"
                      : "false"
                  }
                  data-current={
                    activeAction ===
                    "register-buyer-transaction"
                      ? "true"
                      : "false"
                  }
                  aria-pressed={
                    activeAction ===
                    "register-buyer-transaction"
                  }
                  onClick={() =>
                    setActiveAction(
                      "register-buyer-transaction",
                    )
                  }
                >
                  <div>
                    <span>02</span>

                    <p>
                      TRANSACTION ENTRY
                    </p>
                  </div>

                  <h3>
                    Register Buyer /
                    Transaction
                  </h3>

                  <strong>
                    {actions.registerBuyerTransaction
                      ? "AVAILABLE"
                      : "UNAVAILABLE"}
                  </strong>

                  <p>
                    Record a commercial
                    introduction through the
                    governed French-Ward
                    registration and custody
                    path.
                  </p>
                </button>

                <button
                  type="button"
                  className={
                    styles.actionPosture
                  }
                  data-available={
                    actions.promoteIntakeToOpportunity
                      ? "true"
                      : "false"
                  }
                  data-current={
                    activeAction ===
                    "promote-intake"
                      ? "true"
                      : "false"
                  }
                  aria-pressed={
                    activeAction ===
                    "promote-intake"
                  }
                  onClick={() =>
                    setActiveAction(
                      "promote-intake",
                    )
                  }
                >
                  <div>
                    <span>03</span>

                    <p>
                      LIFECYCLE PASSAGE
                    </p>
                  </div>

                  <h3>
                    Promote Intake →
                    Opportunity
                  </h3>

                  <strong>
                    {actions.promoteIntakeToOpportunity
                      ? "AVAILABLE"
                      : actions.governing
                        ? "RESTRICTED"
                        : "UNAVAILABLE"}
                  </strong>

                  <p>
                    Advance a qualified
                    French-Ward intake into
                    Opportunity posture when
                    the exact governing
                    authority is present.
                  </p>
                </button>
              </section>

              {activeAction ===
              "send-loi" ? (
                actions.sendLoi ? (
                  <section
                    className={
                      styles.actionExecutionPanel
                    }
                    aria-label="Send LOI workstation"
                  >
                    <SendLoiAction />
                  </section>
                ) : (
                  <section
                    className={
                      styles.actionUnavailablePanel
                    }
                  >
                    <span>
                      COMMERCIAL ENTRY
                    </span>

                    <h3>
                      Send LOI
                    </h3>

                    <strong>
                      UNAVAILABLE
                    </strong>

                    <p>
                      This action is unavailable
                      from the current governing
                      posture.
                    </p>
                  </section>
                )
              ) : null}

              {activeAction ===
              "register-buyer-transaction" ? (
                actions.registerBuyerTransaction ? (
                  <section
                    className={
                      styles.actionExecutionPanel
                    }
                    aria-label="Register buyer or transaction workstation"
                  >
                    <RegisterBuyerTransactionAction />
                  </section>
                ) : (
                  <section
                    className={
                      styles.actionUnavailablePanel
                    }
                  >
                    <span>
                      TRANSACTION ENTRY
                    </span>

                    <h3>
                      Register Buyer /
                      Transaction
                    </h3>

                    <strong>
                      UNAVAILABLE
                    </strong>

                    <p>
                      Registration is unavailable
                      from the current governing
                      posture.
                    </p>
                  </section>
                )
              ) : null}

              {activeAction ===
              "promote-intake" ? (
                <section
                  className={
                    styles.actionUnavailablePanel
                  }
                  aria-label="Promote Intake to Opportunity workstation"
                >
                  <span>
                    LIFECYCLE PASSAGE
                  </span>

                  <h3>
                    Promote Intake →
                    Opportunity
                  </h3>

                  <strong>
                    {actions.promoteIntakeToOpportunity
                      ? "AVAILABLE"
                      : actions.governing
                        ? "RESTRICTED"
                        : "UNAVAILABLE"}
                  </strong>

                  <p>
                    Promotion is a distinct
                    governing passage. Operative
                    execution appears only when
                    its exact authority exists.
                  </p>
                </section>
              ) : null}

              <aside
                className={
                  styles.actionBoundary
                }
              >
                <span>
                  VISIBILITY ≠ AUTHORITY
                </span>

                <p>
                  {actions.governing
                    ? "Capability posture reflects the current authenticated governing identity. Available controls execute only through their independently enforced institutional authority boundaries."
                    : "Administrative review may inspect this surface, but does not confer French-Ward governing or commercial execution authority."}
                </p>
              </aside>
            </section>
          ) : null}

          {activeModule ===
          "people" ? (
            <section
              className={
                styles.moduleStage
              }
              aria-labelledby="people-title"
            >
              <header
                className={
                  styles.moduleIntro
                }
              >
                <p
                  id="people-title"
                  className={
                    styles.micro
                  }
                >
                  INSTITUTIONAL PRESENCE
                </p>

                <p
                  className={
                    styles.moduleGuide
                  }
                >
                  Governing participants,
                  counterparties,
                  representatives, and other
                  recognized parties
                  connected to French-Ward
                  work.
                </p>
              </header>

              <div
                className={
                  styles.peopleField
                }
              >
                <article
                  className={
                    styles.personRow
                  }
                >
                  <span>
                    {home.participant.kind ===
                    "GOVERNING"
                      ? "GOVERNING"
                      : home.participant.kind ===
                          "INSTITUTIONAL"
                        ? home.participant
                            .capacityClass ??
                          "INSTITUTIONAL"
                        : "ADMIN REVIEW"}
                  </span>

                  <div>
                    <strong>
                      {
                        home.participant
                          .name
                      }
                    </strong>
                    <p>
                      {
                        home.participant
                          .institutionalTitle
                      }
                    </p>
                  </div>

                  <code>
                    {home.participant
                      .reference ??
                      "ADMIN REVIEW"}
                  </code>
                </article>

                {people.map((person) => (
                  <article
                    className={
                      styles.personRow
                    }
                    key={`${person.role}:${person.legalName}`}
                  >
                    <span>
                      {humanize(
                        person.role,
                      )}
                    </span>

                    <div>
                      <strong>
                        {
                          person.legalName
                        }
                      </strong>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>

      <aside
        id="fw-awareness-rail"
        className={`${styles.rightRail} ${refinement.refinedRail}`}
        aria-label="French-Ward awareness"
        data-open={
          awarenessOpen
            ? "true"
            : "false"
        }
      >
        <div
          className={
            styles.railEthos
          }
          data-rail="custodial"
        >
          <span>
            CUSTODIAL / AWARENESS
          </span>

          <strong>
            Custodians
          </strong>

          <p>
            Custody preserves continuity.
            Passage remains recorded.
          </p>
        </div>

        <button
          type="button"
          className={`${styles.railToggle} ${refinement.railControl}`}
          aria-label={awarenessOpen
            ? "Close Awareness Panel"
            : "Open Awareness Panel"}
          aria-controls="fw-awareness-content"
          aria-expanded={
            awarenessOpen
          }
          onClick={() =>
            setAwarenessOpen(
              (open) => !open,
            )
          }
        >
          <span>
            {awarenessOpen
              ? "CLOSE PANEL"
              : "◈"}
          </span>

          <strong>
            {awarenessOpen
              ? "×"
              : ""}
          </strong>
        </button>

        <div
          id="fw-awareness-content"
          className={
            styles.awarenessContent
          }
          aria-hidden={
            !awarenessOpen
          }
          inert={!awarenessOpen}
        >
          <section
            className={
              styles.rightSection
            }
          >
            <h2
              className={
                styles.rightTitle
              }
            >
              {activeModule === "matters"
                ? "Matter Attention"
                : "Attention"}
            </h2>

            {home.attention.length ===
            0 ? (
              <p
                className={
                  styles.emptyRight
                }
              >
                Nothing currently requires
                institutional attention.
              </p>
            ) : (
              home.attention.map(
                (item) => (
                  <div
                    className={
                      styles.attentionItem
                    }
                    key={`${item.matterId}-${item.kind}`}
                  >
                    <strong>
                      {item.matterTitle}
                    </strong>
                    <span>
                      {item.label}
                    </span>
                  </div>
                ),
              )
            )}
          </section>

          <section
            className={
              styles.rightSection
            }
          >
            <h2
              className={
                styles.rightTitle
              }
            >
              Recent Movement
            </h2>

            {home.recentMovement
              .length === 0 ? (
              <p
                className={
                  styles.emptyRight
                }
              >
                No recorded matter movement
                is present yet.
              </p>
            ) : (
              home.recentMovement
                .slice(0, 8)
                .map((movement) => (
                  <div
                    className={
                      styles.movementItem
                    }
                    key={movement.id}
                  >
                    <strong>
                      {
                        movement
                          .matterTitle
                      }
                    </strong>

                    <span>
                      {
                        movement.message
                      }
                    </span>

                    <time>
                      {
                        movement
                          .occurredAt
                      }
                    </time>
                  </div>
                ))
            )}
          </section>

          <section
            className={
              styles.rightSection
            }
          >
            <h2
              className={
                styles.rightTitle
              }
            >
              Field Status
            </h2>

            <dl
              className={
                styles.statusLedger
              }
            >
              <div>
                <dt>
                  Active matters
                </dt>
                <dd>
                  {home.matters.length
                    .toString()
                    .padStart(2, "0")}
                </dd>
              </div>

              <div>
                <dt>
                  Attention
                </dt>
                <dd>
                  {home.attention.length
                    .toString()
                    .padStart(2, "0")}
                </dd>
              </div>

              <div>
                <dt>
                  Movement
                </dt>
                <dd>
                  {home.recentMovement
                    .length === 0
                    ? "—"
                    : home.recentMovement
                        .length}
                </dd>
              </div>

              <div>
                <dt>
                  Module
                </dt>
                <dd>
                  {
                    currentModule.label
                  }
                </dd>
              </div>
            </dl>
          </section>

          {home.participant.kind ===
          "ADMINISTRATIVE_REVIEW" ? (
            <div
              className={
                styles.reviewNotice
              }
            >
              Administrative review does
              not infer French-Ward
              governing or commercial
              standing.
            </div>
          ) : home.participant.kind ===
            "INSTITUTIONAL" ? (
            <div
              className={
                styles.reviewNotice
              }
            >
              Institutional participation
              does not infer French-Ward
              governing or commercial
              authority.
            </div>
          ) : null}
        </div>
      </aside>
    </main>
  );
}
