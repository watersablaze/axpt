import FWPassageGlyph from './FWPassageGlyph'

import styles from './FWField.module.css'

const passageStages = [
  {
    number: '01',
    title: 'Source',
    body:
      'The asset exists within an identifiable source context.',
  },
  {
    number: '02',
    title: 'Authority',
    body:
      'The right to represent, allocate, sell, transfer, or issue instructions regarding the asset can be attributed.',
  },
  {
    number: '03',
    title: 'Classification',
    body:
      'The material is sufficiently defined within the relevant legal, commercial, and technical framework.',
  },
  {
    number: '04',
    title: 'Documentation',
    body:
      'Evidence supports the identity, origin, authority, quantity, condition, and transaction context of the asset.',
  },
  {
    number: '05',
    title: 'Fiscal Clearance',
    body:
      'Applicable taxes, duties, fees, declarations, and related obligations have been identified and governed.',
  },
  {
    number: '06',
    title: 'Export Permission',
    body:
      'The conditions required for lawful movement from the source jurisdiction have been satisfied.',
  },
  {
    number: '07',
    title: 'Logistics',
    body:
      'Custody, transport, security, insurance, handling, and handoff can actually occur.',
  },
  {
    number: '08',
    title: 'Receiving / Refinery Intake',
    body:
      'The receiving institution is prepared to accept, verify, recognize, and process the material.',
  },
  {
    number: '09',
    title: 'Settlement',
    body:
      'Value can move through an authorized mechanism and reach an agreed state of finality.',
  },
]

const frictionSignals = [
  'Possession may be mistaken for authority.',
  'An authentic document may be mistaken for a current document.',
  'Export intention may be mistaken for export eligibility.',
  'Access to a financial rail may be mistaken for settlement.',
  'A willing buyer may be mistaken for an executable transaction.',
]

const institutionalQuestions = [
  'Who may act?',
  'What authority can be attributed?',
  'What evidence remains current?',
  'What conditions remain unsatisfied?',
  'What must happen before the asset may cross a jurisdiction?',
  'Who receives custody next?',
  'What constitutes successful delivery?',
  'What constitutes successful settlement?',
  'Which participant is responsible for each transition?',
]

export default function FWField() {
  return (
    <article
      className={styles.field}
      id="field-notes"
      aria-labelledby="field-note-001-title"
    >
      <aside className={styles.passageNotation}>
        <FWPassageGlyph />
      </aside>

      <header className={styles.header}>
        <div className={styles.issueBand}>
          <div className={styles.issueIdentity}>
            <span className={styles.issueType}>
              Field Note
            </span>

            <span className={styles.issueNumber}>
              001
            </span>
          </div>

          <div className={styles.issueMeta}>
            <span>September 2026</span>
            <span>Public</span>
          </div>
        </div>

        <p className={styles.classification}>
          Trade / Source Authority / Export Governance
        </p>

        <h1
          className={styles.title}
          id="field-note-001-title"
        >
          When Gold Exists but Passage Is Not Yet Governed
        </h1>

        <p className={styles.lede}>
          Gold can physically exist, be identifiable, and be
          available to a source without yet being capable of lawful
          commercial passage. The distinction matters because assets
          do not move through possession alone.
        </p>
      </header>

      {/* ─────────────────────────────
          FIELD SIGNAL
      ───────────────────────────── */}

      <section
        className={`${styles.section} ${styles.readingSection} ${styles.fieldSignal}`}
        data-register="FIELD SIGNAL"
      >
        <p className={styles.sectionLabel}>
          Field Signal
        </p>

        <div className={styles.prose}>
          <p className={styles.signalLead}>
            A curious thing happens around gold.
          </p>

          <p>
            Someone can put the metal on a table. It can be weighed,
            photographed, filmed, tested, associated with a known
            source, and presented with complete confidence that it
            exists.
          </p>

          <p>
            And still, the transaction may be nowhere near ready to
            move.
          </p>

          <p>
            To the person standing beside the gold, this can feel
            absurd. The asset is there. It is tangible. It has weight.
            It can be touched.
          </p>

          <p className={styles.humanQuestion}>
            What more could the system possibly need?
          </p>

          <p className={styles.shortAnswer}>
            Quite a lot, as it turns out.
          </p>

          <p>
            The difficulty is that physical existence answers only
            one question. Trade introduces many others.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────
          01 / FIELD CONDITION
      ───────────────────────────── */}

      <section
        className={`${styles.section} ${styles.readingSection} ${styles.registeredSection}`}
        data-register="01 / FIELD CONDITION"
      >
        <p className={styles.sectionLabel}>
          Field Condition
        </p>

        <div className={styles.prose}>
          <p>
            In high-value commodity trade, the existence of an asset
            does not by itself establish the conditions required for
            commercial passage.
          </p>

          <p>
            It does not establish who may lawfully act upon the asset.
          </p>

          <p>
            It does not establish whether the asset has been attached
            to a specific transaction, whether documentary evidence
            remains current, whether fiscal and export obligations
            have been satisfied, whether transport and custody are
            executable, whether a receiving institution is prepared
            to accept the material, or whether the chosen settlement
            architecture can bring the exchange to finality.
          </p>

          <p>
            Yet these very different conditions are often compressed
            into a single word:
          </p>

          <p className={styles.emphasisWord}>
            available.
          </p>

          <p>
            That compression creates confusion.
          </p>

          <p>
            A source may say the gold is available because the gold is
            physically present.
          </p>

          <p>
            A buyer may hear <em>available</em> and understand that
            the gold can now be purchased, exported, delivered,
            refined, and settled.
          </p>

          <p>
            Those statements can coexist without either party
            necessarily speaking dishonestly.
          </p>

          <p>
            They may simply be describing different stages of reality.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────
          02 / THE DISTINCTION
      ───────────────────────────── */}

      <section
        className={`${styles.section} ${styles.primarySection} ${styles.registeredSection}`}
        data-register="02 / DISTINCTION"
      >
        <p className={styles.sectionLabel}>
          The Distinction
        </p>

        <div className={styles.distinction}>
          <span>Gold existence</span>
          <span>≠ source authority</span>
          <span>≠ aggregation capacity</span>
          <span>≠ transaction attachment</span>
          <span>≠ export eligibility</span>
          <span>≠ receiving readiness</span>
          <span>≠ settlement readiness</span>
        </div>

        <div className={styles.bridge}>
          <p>
            These are not competing descriptions of one condition.
          </p>

          <p>
            They are separate states, governed by different evidence,
            institutions, permissions, procedures, and timelines.
          </p>

          <p>
            An asset can satisfy one and fail another.
          </p>

          <p>
            That distinction is where serious trade begins.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────
          03 / PASSAGE ARCHITECTURE
      ───────────────────────────── */}

      <section
        className={`${styles.section} ${styles.structuralSection} ${styles.registeredSection}`}
        data-register="03 / PASSAGE"
      >
        <p className={styles.sectionLabel}>
          Passage Architecture
        </p>

        <div className={styles.structuralIntro}>
          <p>
            Gold does not become commercially executable because one
            party declares it ready.
          </p>

          <p>
            Passage emerges when a surrounding system becomes
            sufficiently aligned.
          </p>

          <p>
            A simplified architecture might look like this:
          </p>
        </div>

        <div className={styles.passageList}>
          {passageStages.map((stage) => (
            <div
              className={styles.passageStage}
              key={stage.number}
            >
              <span className={styles.passageIndex}>
                {stage.number}
              </span>

              <div className={styles.passageContent}>
                <h3>{stage.title}</h3>
                <p>{stage.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.architectureCaveat}>
          <p>
            The exact order and requirements will differ by
            jurisdiction, commodity, transaction structure,
            counterparties, and settlement method.
          </p>

          <p>
            The principle does not.
          </p>

          <p className={styles.architecturePrinciple}>
            Passage is produced by alignment across multiple
            conditions.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────
          04 / FRICTION
      ───────────────────────────── */}

      <section
        className={`${styles.section} ${styles.readingSection} ${styles.registeredSection}`}
        data-register="04 / FRICTION"
      >
        <p className={styles.sectionLabel}>
          Friction
        </p>

        <div className={styles.prose}>
          <p>
            Much of the friction around commodity transactions begins
            when one stage is treated as proof that the others have
            already been completed.
          </p>
        </div>

        <div className={styles.voiceSequence}>
          <p>A source speaks from possession.</p>
          <p>A buyer speaks from purchasing capacity.</p>
          <p>An intermediary speaks from access.</p>
          <p>A transporter speaks from movement.</p>
          <p>A customs authority speaks from lawful export.</p>
          <p>A refinery speaks from intake requirements.</p>
          <p>
            A bank or settlement provider speaks from financial
            authorization and finality.
          </p>
        </div>

        <div className={styles.prose}>
          <p>
            Everyone may be speaking accurately.
          </p>

          <p>
            Everyone may also be speaking about something different.
          </p>

          <p>
            This is where seemingly simple statements begin to
            fracture.
          </p>
        </div>

        <div className={styles.frictionSignals}>
          {frictionSignals.map((signal) => (
            <p key={signal}>{signal}</p>
          ))}
        </div>

        <div className={styles.prose}>
          <p>
            And once these distinctions collapse, procedural
            requirements can begin to look like obstruction rather
            than architecture.
          </p>

          <p className={styles.warning}>
            That is dangerous territory.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────
          05 / FRENCH-WARD READING
      ───────────────────────────── */}

      <section
        className={`${styles.section} ${styles.structuralSection} ${styles.registeredSection}`}
        data-register="05 / FRENCH-WARD READING"
      >
        <p className={styles.sectionLabel}>
          French-Ward Reading
        </p>

        <div className={styles.prose}>
          <p>
            A serious institution does not ask only:
          </p>

          <p className={styles.centralQuestion}>
            Does the gold exist?
          </p>

          <p>
            It asks what has been established around the gold.
          </p>
        </div>

        <div className={styles.questionRegister}>
          {institutionalQuestions.map((question) => (
            <p key={question}>{question}</p>
          ))}
        </div>

        <div className={styles.prose}>
          <p className={styles.humanObservation}>
            There is a peculiar frustration that enters a room when
            everyone believes a transaction is ready and no one can
            identify precisely what <em>ready</em> means.
          </p>

          <p>
            That frustration is useful.
          </p>

          <p>
            It often reveals that the parties have reached the edge of
            possession and entered the domain of governance.
          </p>

          <p>
            French-Ward treats that boundary seriously.
          </p>

          <p>
            Because institutional readiness is not created by
            confidence in one participant, the existence of one
            document, the availability of one payment rail, or even
            the physical presence of the commodity itself.
          </p>

          <p>
            It emerges when authority, evidence, procedure,
            infrastructure, responsibility, and timing become coherent
            enough to carry the asset forward.
          </p>

          <p className={styles.readingResolve}>
            That coherence is passage.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────
          06 / WATCHPOINT
      ───────────────────────────── */}

      <div className={styles.terminalField}>
        <section
          className={styles.watchpoint}
          data-register="06 / WATCHPOINT"
        >
          <p className={styles.sectionLabel}>
            Watchpoint
          </p>

          <p>
            Commodity passage is becoming increasingly dependent upon
            systems that were once treated as separate: source
            verification, documentary continuity, financial
            compliance, digital verification, logistics, customs,
            custody, and settlement infrastructure.
          </p>

          <p>
            As these systems become more tightly coupled, the distance
            between <strong>physical availability</strong> and{' '}
            <strong>institutional readiness</strong> becomes more
            visible.
          </p>

          <p>
            The important question will increasingly be not merely
            whether an asset exists, but whether the surrounding
            architecture can prove that it is ready to move.
          </p>
        </section>

        <section className={styles.closing}>
          <p className={styles.closingLead}>
            Doctrine 001
          </p>

          <p className={styles.closingResolve}>
            Existence is a property of the asset.
            <br />
            Passage is a property of the system surrounding it.
          </p>

          <p className={styles.secondaryDoctrine}>
            Availability is not a single state.
          </p>
        </section>
      </div>
    </article>
  )
}
