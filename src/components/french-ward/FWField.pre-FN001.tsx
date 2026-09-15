import FWPassageGlyph from './FWPassageGlyph'

import styles from './FWField.module.css'

const passageStages = [
  {
    number: '01',
    label: 'Source',
    note: 'The asset exists within an identifiable source relationship.',
  },
  {
    number: '02',
    label: 'Authority',
    note: 'The right to represent, allocate, transfer, or instruct is attributable.',
  },
  {
    number: '03',
    label: 'Classification',
    note: 'The asset is defined within the legal and commercial framework that governs it.',
  },
  {
    number: '04',
    label: 'Documentation',
    note: 'Evidence supports identity, provenance, authority, quantity, and transaction condition.',
  },
  {
    number: '05',
    label: 'Fiscal Clearance',
    note: 'Applicable taxes, duties, fees, and statutory obligations are satisfied or governed.',
  },
  {
    number: '06',
    label: 'Export Permission',
    note: 'The asset is eligible to leave the source jurisdiction through lawful procedure.',
  },
  {
    number: '07',
    label: 'Logistics',
    note: 'Custody, transport, insurance, security, and handoff conditions are executable.',
  },
  {
    number: '08',
    label: 'Refinery Intake',
    note: 'The receiving institution is prepared to accept, test, recognize, and process the asset.',
  },
  {
    number: '09',
    label: 'Settlement',
    note: 'Value can move through an authorized rail into a condition recognized as final.',
  },
]

export default function FWField() {
  return (
    <article className={styles.field} id="field-notes">
      <aside className={styles.passageNotation}>
        <FWPassageGlyph />
      </aside>

      <header className={styles.header}>
        <div className={styles.issueBand}>
          <div className={styles.issueIdentity}>
            <span className={styles.issueType}>Field Note</span>
            <span className={styles.issueNumber}>001</span>
          </div>

          <div className={styles.issueMeta}>
            <span>September 2026</span>
            <span>Public</span>
          </div>
        </div>

        <div className={styles.classification}>
          Trade / Source Authority / Export Governance
        </div>

        <h2 className={styles.title}>
          When Gold Exists but Passage Is Not Yet Governed
        </h2>

        <p className={styles.lede}>
          Gold is often discussed as though physical existence resolves the
          transaction question. It does not.
        </p>
      </header>

      <section className={`${styles.section} ${styles.readingSection}`}>
        <p className={styles.sectionLabel}>Opening Observation</p>

        <div className={styles.prose}>
          <p>
            Physical existence establishes one fact: the asset is there.
            It does not, by itself, establish who may act upon it, whether it
            may lawfully move, whether the receiving institution is prepared
            to accept it, or whether the financial system surrounding the
            transaction can bring settlement to finality.
          </p>

          <p>
            Many commodity transactions become confused because several
            different states of readiness are compressed into a single word:
            availability.
          </p>
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.primarySection} ${styles.registeredSection}`}
        data-register="01 / DISTINCTION"
      >
        <p className={styles.sectionLabel}>The Distinction</p>

        <div className={styles.distinction}>
          <span>Gold existence</span>
          <span>≠ source authority</span>
          <span>≠ aggregation capacity</span>
          <span>≠ export eligibility</span>
          <span>≠ refining readiness</span>
          <span>≠ settlement property</span>
        </div>

        <p className={styles.distinctionBridge}>
          These are not interchangeable descriptions of one condition.
          They are separate states that must become aligned before passage
          can be treated as executable.
        </p>
      </section>

      <section
        className={`${styles.section} ${styles.structuralSection} ${styles.registeredSection}`}
        data-register="02 / PASSAGE"
      >
        <div className={styles.sectionHeading}>
          <p className={styles.sectionLabel}>Field Architecture</p>

          <p className={styles.sectionIntro}>
            Passage emerges through a sequence of governed conditions.
            Each stage changes what can lawfully and operationally occur next.
          </p>
        </div>

        <div className={styles.passage}>
          {passageStages.map((stage) => (
            <div
              className={`${styles.passageStage} ${
                stage.number === '09' ? styles.passageTerminal : ''
              }`}
              key={stage.number}
            >
              <div className={styles.passageIndex}>
                {stage.number}
              </div>

              <div className={styles.passageContent}>
                <h3>{stage.label}</h3>
                <p>{stage.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.readingSection}`}>
        <p className={styles.sectionLabel}>Why the Confusion Happens</p>

        <div className={styles.prose}>
          <p>
            Commercial urgency tends to flatten complexity. A source may speak
            from the certainty of possession. A buyer may speak from the
            certainty of purchasing capacity. An intermediary may speak from
            access. A regulator, bank, customs authority, transporter, or
            refinery may be evaluating an entirely different condition.
          </p>

          <p>
            Each party can therefore be describing the same asset accurately
            while still describing a different stage of its passage.
          </p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.readingSection}`}>
        <p className={styles.sectionLabel}>Operational Consequence</p>

        <div className={styles.prose}>
          <p>
            When physical availability is mistaken for institutional
            readiness, ordinary procedural requirements can be misread as
            unexpected barriers or evidence of failure.
          </p>

          <p>
            Conversely, possession can be mistaken for authority, an authentic
            document can be mistaken for a current one, and access to a payment
            rail can be mistaken for completed settlement.
          </p>
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.structuralSection} ${styles.registeredSection}`}
        data-register="03 / INSTITUTIONAL LENS"
      >
        <p className={styles.sectionLabel}>Institutional Lens</p>

        <div className={styles.prose}>
          <p>
            A serious institution does not ask only whether the asset exists.
            It asks whether the surrounding conditions are aligned strongly
            enough for the asset to proceed.
          </p>

          <p>
            Institutional readiness is produced through attributable authority,
            current evidence, lawful procedure, executable infrastructure, and
            synchronized timing.
          </p>
        </div>
      </section>

      <div className={styles.terminalField}>
        <section className={styles.watchpoint}>
          <div>
            <p className={styles.sectionLabel}>Watchpoint</p>
          </div>

          <p>
            As traceability, source verification, financial compliance, and
            documentary continuity become more tightly coupled, the distance
            between physical availability and institutional readiness will
            become increasingly visible.
          </p>
        </section>

        <footer className={styles.closing}>
          <p className={styles.closingLead}>
            The existence of gold establishes the presence of an asset.
          </p>

          <p className={styles.closingResolve}>
            Passage begins only when the surrounding system can lawfully,
            evidentially, and operationally carry that asset forward.
          </p>
        </footer>
      </div>
    </article>
  )
}
