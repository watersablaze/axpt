import { notFound } from "next/navigation";

import styles from "../page.module.css";
import { GlobalMotherConstitutionalShell } from "@/components/french-ward/gm/GlobalMotherConstitutionalShell";
import { globalMotherV5Definition } from "@/domains/instruments/definitions/globalMotherV5Definition";
import { globalMotherCycleV2Plan } from "@/domains/instruments/definitions/globalMotherCycleV2Plan";

export const dynamic = "force-dynamic";

const movements = [
  {
    index: "00",
    label: "Mission Overview",
    notation: "Mission",
    active: true,
  },
  { index: "I", label: "Recognition & Relationship" },
  { index: "II", label: "Authority & Custodianship" },
  { index: "III", label: "Governed Gold Passage" },
  { index: "IV", label: "Restoration & Continuity" },
  { index: "V", label: "Deliberation & Instrument Formation" },
] as const;

const movementGroups = [
  {
    index: "I",
    domain: "Recognition & Relationship",
    heading: "Relationship is established before obligation.",
    lead:
      "The Chamber begins by clarifying the institutions present, the bridge that brought them together, and what participation does—and does not—create.",
    references: ["ALIGN-01", "ALIGN-02"],
  },
  {
    index: "II",
    domain: "Authority & Custodianship",
    heading: "Authority remains attributable.",
    lead:
      "Each institution enters with its own standing. Custodianship and coordination do not collapse those distinct authorities into one another.",
    references: ["ALIGN-03"],
  },
  {
    index: "III",
    domain: "Governed Gold Passage",
    heading: "Gold passage is governed in layers.",
    lead:
      "Refinery readiness belongs within the passage architecture, while refinery-specific obligations belong to the definitive transaction layer.",
    references: ["ALIGN-04", "ALIGN-05"],
  },
  {
    index: "IV",
    domain: "Restoration & Continuity",
    heading: "The relationship should produce continuing value.",
    lead:
      "Commercial movement is not treated as an end in itself. Return, capacity, restoration, and useful institutional contribution remain part of the intended field.",
    references: ["ALIGN-06"],
  },
  {
    index: "V",
    domain: "Deliberation & Instrument Formation",
    heading: "Formation follows clarity.",
    lead:
      "The Chamber records alignment and unresolved questions before later agreements or transaction instruments are prepared.",
    references: ["ALIGN-07", "ALIGN-08"],
  },
] as const;

export default function GlobalMotherV2DraftPreviewPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL_ENV === "production"
  ) {
    notFound();
  }

  const participants = globalMotherCycleV2Plan.participants.map(
    (participant) => ({
      id: participant.key,
      name: participant.name,
      institution: participant.institution,
      capacity: participant.capacity,
      current: false,
    }),
  );

  const overview = {
    mission:
      "Establish a protected, values-aligned operating field for custodial gold passage, institutional coordination, restoration, and responsible global trade.",
    currentState: [
      "Chamber V1 concluded and preserved in Intermission.",
      "Chamber V2 is in preparation; no V2 access or commercial authority has been issued.",
      "Refinery readiness is affirmed as a principal operational requirement.",
      "The Framework remains the relationship and authority layer before definitive transaction instruments.",
    ],
    clarified: [
      "Relationship precedes obligation.",
      "Authority remains attributable to each institution.",
      "Refinery-specific terms belong to the later commercial layer.",
      "Technology serves private coordination, continuity, and documentary integrity.",
    ],
    attention: [
      "Confirm standing, responsibilities, and authority boundaries.",
      "Resolve unanswered deliberative questions directly.",
      "Advance refinery relationships and readiness in proper sequence.",
      "Determine whether sufficient alignment exists for definitive formation.",
    ],
    protocol: [
      "Clarity before pressure.",
      "Understanding before assumption.",
      "Alignment before obligation.",
      "Conditions before movement.",
    ],
  } as const;

  return (
    <GlobalMotherConstitutionalShell
      eyebrow="French-Ward / Internal Chamber V2 Draft"
      title={globalMotherV5Definition.title}
      subtitle={globalMotherV5Definition.subtitle}
      reference={globalMotherV5Definition.reference}
      version="V5 · CHAMBER V2 DRAFT"
      status="DRAFT · INTERNAL PREVIEW · NOT ISSUED"
      movements={[...movements]}
      recipient={null}
      chamberParticipants={participants}
      presentation="operative-v2"
    >
      <section
        id="gm-mission-overview"
        className={styles.v2MissionOverview}
        aria-labelledby="gm-v2-mission-title"
      >
        <header className={styles.v2MissionHeader}>
          <div>
            <p className={styles.v2SystemKicker}>Chamber V2 · Mission Protocol</p>
            <h2 id="gm-v2-mission-title">A clearer field for coordinated action.</h2>
          </div>
          <span className={styles.v2SystemState}>PREPARATION · NOT ISSUED</span>
        </header>

        <p className={styles.v2MissionStatement}>{overview.mission}</p>

        <div className={styles.v2MissionRail} aria-label="Formation sequence">
          {[
            "Relationship",
            "Authority",
            "Deliberation",
            "Agreement",
            "Conditions",
            "Movement",
          ].map((step, index) => (
            <div key={step} className={index === 2 ? styles.v2MissionRailActive : undefined}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>

        <div className={styles.v2MissionGrid}>
          <section>
            <span>Current state</span>
            {overview.currentState.map((item) => <p key={item}>{item}</p>)}
          </section>
          <section>
            <span>Clarified</span>
            {overview.clarified.map((item) => <p key={item}>{item}</p>)}
          </section>
          <section>
            <span>Requires attention</span>
            {overview.attention.map((item) => <p key={item}>{item}</p>)}
          </section>
          <section className={styles.v2ProtocolModule}>
            <span>Operating doctrine</span>
            {overview.protocol.map((item) => <strong key={item}>{item}</strong>)}
          </section>
        </div>

        <footer className={styles.v2MissionFooter}>
          <span>Protected deliberation · custodial trade · sovereign digital coordination</span>
          <strong>Proceed through the Framework →</strong>
        </footer>
      </section>

      {movementGroups.map((movement) => {
        const propositions = globalMotherV5Definition.propositions.filter(
          (proposition) =>
            movement.references.includes(
              proposition.reference as (typeof movement.references)[number],
            ),
        );

        return (
          <section
            key={movement.index}
            id={`gm-movement-${movement.index}`}
            className={`${styles.movement} ${styles.baseArticle}`}
            aria-labelledby={`gm-v5-heading-${movement.index}`}
          >
            <header className={styles.movementHeader}>
              <span className={styles.movementNumber}>{movement.index}</span>
              <div>
                <p className={styles.movementKicker}>{movement.domain}</p>
                <h2 id={`gm-v5-heading-${movement.index}`}>
                  {movement.heading}
                </h2>
                <p className={styles.movementLead}>{movement.lead}</p>
              </div>
            </header>

            <div className={styles.articleBody}>
              {propositions.map((proposition) => (
                <article
                  key={proposition.reference}
                  style={{
                    padding: "1.35rem 0",
                    borderTop: "1px solid rgba(173, 194, 213, .16)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "1rem",
                      marginBottom: ".7rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: ".7rem",
                        letterSpacing: ".14em",
                        opacity: .56,
                      }}
                    >
                      {proposition.reference}
                    </span>
                    <span
                      style={{
                        fontSize: ".66rem",
                        letterSpacing: ".12em",
                        opacity: .42,
                      }}
                    >
                      PROPOSED
                    </span>
                  </div>

                  <h3
                    style={{
                      margin: "0 0 .6rem",
                      fontSize: "1rem",
                      fontWeight: 600,
                    }}
                  >
                    {proposition.title}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      maxWidth: "72ch",
                      lineHeight: 1.72,
                      opacity: .78,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {proposition.body}
                  </p>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </GlobalMotherConstitutionalShell>
  );
}
