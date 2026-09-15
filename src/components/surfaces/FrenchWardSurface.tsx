import Link from 'next/link'

import styles from './FrenchWardSurface.module.css'

export default function FrenchWardSurface() {
  return (
    <div
      className={styles.frenchWardSurface}
    >
      <div className={styles.inner}>
        <div className={styles.identity}>
          <img
            src="/FW/french-ward_V3.2.png"
            alt=""
            className={styles.seal}
            draggable={false}
          />

          <span className={styles.registration}>
            French-Ward
          </span>

          <span className={styles.classification}>
            Trade &amp; Field Intelligence
          </span>
        </div>

        <div className={styles.field}>
          <p className={styles.fieldMarker}>
            Source Authority / Trade Passage / Field Intelligence
          </p>

          <div className={styles.mobileInstitutionalHeader}>
            <div className={styles.mobileIdentityText}>
              <span className={styles.mobileRegistration}>
                French-Ward
              </span>

              <span className={styles.mobileClassification}>
                Trade &amp; Field Intelligence
              </span>
            </div>
          </div>

          <div className={styles.mobileTitleCluster}>
            <h2 className={styles.title}>
              Trade depends on
              <span>more than markets.</span>
            </h2>

            <img
              className={styles.mobileSeal}
              src="/FW/french-ward_V3.2.png"
              alt=""
              aria-hidden="true"
              draggable={false}
            />
          </div>

          <div className={styles.institutionalDefinition}>
            <p>
              French-Ward operates where source authority,
              commercial passage, documentary governance,
              and field intelligence meet.
            </p>

            <p>
              Within AXPT, it grounds institutional architecture
              in real trade corridors, counterparties, evidence,
              and execution conditions.
            </p>
          </div>

          <section
            className={styles.record}
            aria-labelledby="french-ward-record-label"
          >
            <p
              id="french-ward-record-label"
              className={styles.recordLabel}
            >
              Institutional Record
            </p>

            <nav
              className={styles.entries}
              aria-label="French-Ward institutional record"
            >
              <Link
                className={styles.entry}
                href="/french-ward#profile"
              >
                <span className={styles.entryNumber}>01</span>

                <span className={styles.entryLabel}>
                  Institutional Profile
                </span>

                <span
                  className={styles.entryArrow}
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>

              <Link
                className={styles.entry}
                href="/french-ward#field-notes"
              >
                <span className={styles.entryNumber}>02</span>

                <span className={styles.entryLabel}>
                  Field Note 001
                </span>

                <span
                  className={styles.entryArrow}
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            </nav>
          </section>
        </div>
      </div>
    </div>
  )
}
