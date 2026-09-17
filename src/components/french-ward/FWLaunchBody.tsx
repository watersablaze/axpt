import Image from "next/image";
import Link from "next/link";

import styles from "./FWLaunchBody.module.css";

const practiceAreas = [
  ["01", "Source & Authority"],
  ["02", "Commercial Documentation"],
  ["03", "Transaction Readiness"],
  ["04", "Delivery & Passage"],
  ["05", "Settlement Coordination"],
];

const operatingArticles = [
  ["I", "Authority must be attributable."],
  ["II", "Evidence must remain current."],
  ["III", "Movement requires more than possession."],
  ["IV", "Settlement requires more than access to a rail."],
];

const progression = [
  ["01", "Intake"],
  ["02", "Review"],
  ["03", "Qualification"],
  ["04", "Dossier"],
  ["05", "Execution"],
];

export default function FWLaunchBody() {
  return (
    <div className={styles.surface}>
      {/* ─────────────────────────────
          TITLE LEAF
      ───────────────────────────── */}

      <section
        className={styles.titleLeaf}
        id="profile"
        aria-labelledby="fw-title"
      >
        <div className={styles.titleLeafInner}>
          <div className={styles.titleRegister}>
            <span>Institutional Folio / 2026</span>
            <span>Secure Commodity Management</span>
          </div>

          <div className={styles.titleComposition}>
            <div className={styles.titleInscription}>
              <h1 id="fw-title">
                FRENCH-WARD, INC.
              </h1>

              <p className={styles.custodialThesis}>
                Custodianship for sovereign wealth in passage.
              </p>

              <p className={styles.constitution}>
                French-Ward coordinates the authority,
                documentary continuity, institutional
                readiness, lawful passage, and settlement
                conditions required to move high-value trade
                from source toward receiving institutions.
              </p>

              <p className={styles.custodialStatement}>
                Our custodial role is exercised through
                source-side commercial relationships,
                mandate integrity, controlled documentation,
                transaction qualification, and accountable
                passage.
              </p>
            </div>

            <div
              className={styles.custodialSeal}
              aria-hidden="true"
            >
              <div className={styles.sealOrbit}>
                <Image
                  src="/FW/french-ward_V3.2.png"
                  alt=""
                  width={230}
                  height={230}
                  priority
                />
              </div>

              <span>Custodial Authority</span>
            </div>
          </div>

          <div
            className={styles.routeSpine}
            aria-label="French-Ward operating continuum"
          >
            <span>Source</span>
            <i aria-hidden="true" />
            <span>Authority</span>
            <i aria-hidden="true" />
            <span>Custodianship</span>
            <i aria-hidden="true" />
            <span>Documentation</span>
            <i aria-hidden="true" />
            <span>Passage</span>
            <i aria-hidden="true" />
            <span>Settlement</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────
          FOLIO BODY
      ───────────────────────────── */}

      <section className={styles.folio}>
        <div className={styles.folioInner}>
          {/* 01 / THE HOUSE */}

          <article className={styles.houseArticle}>
            <header className={styles.articleHeader}>
              <span>01</span>

              <div>
                <p>The House</p>
                <small>Institutional Profile</small>
              </div>
            </header>

            <div className={styles.houseComposition}>
              <div className={styles.manuscript}>
                <p className={styles.dropStatement}>
                  French-Ward operates where source,
                  commercial authority, documentary
                  continuity, passage, and settlement must
                  be made coherent enough to carry a
                  transaction forward.
                </p>

                <p>
                  The work begins before execution. It
                  includes attribution of authority,
                  qualification of counterparties,
                  documentary alignment, commercial
                  sequencing, delivery architecture, and
                  settlement coordination.
                </p>

                <p>
                  The objective is not simply movement. It
                  is governed movement: a transaction
                  progressing through identifiable
                  conditions, accountable actors, and
                  documentary continuity.
                </p>
              </div>

              <aside
                className={styles.practiceAppendage}
                aria-label="Areas of practice"
              >
                <div className={styles.appendageHeader}>
                  <span>Practice Register</span>
                  <small>Selected areas</small>
                </div>

                <div className={styles.practiceRegister}>
                  {practiceAreas.map(([number, area]) => (
                    <div
                      className={styles.practiceRow}
                      key={number}
                    >
                      <span>{number}</span>
                      <strong>{area}</strong>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </article>

          {/* 02 / OPERATING ARTICLES */}

          <article className={styles.articlesArticle}>
            <header className={styles.articleHeader}>
              <span>02</span>

              <div>
                <p>Operating Articles</p>
                <small>Constitutional Discipline</small>
              </div>
            </header>

            <div className={styles.articleGrid}>
              {operatingArticles.map(
                ([number, statement]) => (
                  <div
                    className={styles.articleClause}
                    key={number}
                  >
                    <span>{number}</span>
                    <p>{statement}</p>
                  </div>
                ),
              )}
            </div>
          </article>

          {/* 03 / COMMERCIAL PASSAGE */}

          <article className={styles.passageArticle}>
            <header className={styles.passageHeader}>
              <div>
                <span>03</span>
                <p>Commercial Passage</p>
              </div>

              <small>
                Controlled progression toward execution.
              </small>
            </header>

            <div className={styles.progression}>
              {progression.map(
                ([number, stage], index) => (
                  <div
                    className={styles.stage}
                    key={number}
                  >
                    <span>{number}</span>
                    <strong>{stage}</strong>

                    {index <
                      progression.length - 1 && (
                      <i aria-hidden="true">→</i>
                    )}
                  </div>
                ),
              )}
            </div>

            <p className={styles.progressionNote}>
              Progression remains subject to commercial,
              authority, compliance, documentary, and
              operational review.
            </p>
          </article>

          {/* 04 / INSTRUMENT REGISTER */}

          <article className={styles.instrumentArticle}>
            <header className={styles.articleHeader}>
              <span>04</span>

              <div>
                <p>Instrument Register</p>
                <small>Defined Institutional Paths</small>
              </div>
            </header>

            <div className={styles.instrumentComposition}>
              <p className={styles.instrumentIntro}>
                Engagement begins through a defined
                institutional path rather than informal
                assumption.
              </p>

              <div className={styles.actions}>
                <Link href="/french-ward/transaction-intake">
                  <div>
                    <span>Commercial Intake</span>
                    <strong>
                      Letter of Intent & Transaction Intake
                    </strong>
                  </div>

                  <span aria-hidden="true">→</span>
                </Link>

                <a href="mailto:connect@axpt.io">
                  <div>
                    <span>Institutional</span>
                    <strong>General Inquiry</strong>
                  </div>

                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </article>

        </div>
      </section>
    </div>
  );
}
