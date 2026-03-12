'use client'

import styles from './FrameworkSurface.module.css'
import SurfaceHeader from '@/components/surfaces/SurfaceHeader'

export default function FrameworkSurface() {
  return (
    <div className={styles.frameworkSurface}>
      <div className={styles.surfaceFrame}>

        <SurfaceHeader kicker="FRAMEWORK" />

        <h2 className={styles.headline}>
          The system map beneath the portal surface.
        </h2>

        <p className={styles.subline}>
          Three layers that stay legible under pressure — principle, authority,
          execution.
        </p>

        <div className={styles.grid}>

          {/* AXIS SPINE */}
          <div className={styles.axisLine} aria-hidden="true" />

          {/* AXIS + CONNECTORS */}
          <div className={styles.frameworkAxis}>
            <div className={styles.axisRow}>
              <span className={styles.axisNode} />
              <span className={styles.axisConnectorLeft} />
            </div>

            <div className={styles.axisRow}>
              <span className={styles.axisNode} />
              <span className={styles.axisConnectorRight} />
            </div>

            <div className={styles.axisRow}>
              <span className={styles.axisNode} />
              <span className={styles.axisConnectorLeft} />
            </div>
          </div>


          {/* CONTINUITY */}
          <article className={`${styles.slab} ${styles.continuity}`}>

            <span className={styles.cornerTicks} aria-hidden="true" />

            <div className={styles.slabTop}>
              <div className={styles.slabLeft}>
                <span className={styles.slabIndex}>01</span>
                <h3 className={styles.slabTitle}>CONTINUITY</h3>
              </div>

              <div className={styles.slabRight}>
                <span className={styles.nodeDot} />
                <span className={styles.nodeLabel}>CIVILIZATION</span>
              </div>
            </div>

            <p className={styles.slabText}>
              Foundational principle and civilizational horizon.
              The orientation that cannot drift.
            </p>

          </article>


          {/* GOVERNANCE */}
          <article className={`${styles.slab} ${styles.governance}`}>

            <span className={styles.cornerTicks} aria-hidden="true" />

            <div className={styles.slabTop}>
              <div className={styles.slabLeft}>
                <span className={styles.slabIndex}>02</span>
                <h3 className={styles.slabTitle}>GOVERNANCE</h3>
              </div>

              <div className={styles.slabRight}>
                <span className={styles.nodeDot} />
                <span className={styles.nodeLabel}>COUNCIL MANDATE</span>
              </div>
            </div>

            <p className={styles.slabText}>
              Council authority translating principle into mandate.
              Human oversight with structural discipline.
            </p>

          </article>


{/* SYSTEMS */}
<article className={`${styles.slab} ${styles.systems}`}>

  <span className={styles.cornerTicks} aria-hidden="true" />

  <div className={styles.slabTop}>
    <div className={styles.slabLeft}>
      <span className={styles.slabIndex}>03</span>
      <h3 className={styles.slabTitle}>SYSTEMS</h3>
    </div>

    <div className={styles.slabRight}>
      <span className={styles.nodeDot} />
      <span className={styles.nodeLabel}>INFRASTRUCTURE</span>
    </div>
  </div>

  <p className={styles.slabText}>
    Where mandate becomes action — and action becomes permanent record.
  </p>

        <div className={styles.systemStack}>

          <div className={styles.systemRow}>
            <span className={styles.systemDot} />
            <div className={styles.systemContent}>
              <span className={styles.systemTitle}>Ledger Engine</span>
              <span className={styles.systemMeta}>
                Custodial accounting layer and immutable transaction record.
              </span>
            </div>
          </div>

          <div className={styles.systemRow}>
            <span className={styles.systemDot} />
            <div className={styles.systemContent}>
              <span className={styles.systemTitle}>Treasury Coordination</span>
              <span className={styles.systemMeta}>
                Settlement orchestration, asset custody, and capital allocation.
              </span>
            </div>
          </div>

          <div className={styles.systemRow}>
            <span className={styles.systemDot} />
            <div className={styles.systemContent}>
              <span className={styles.systemTitle}>Broadcast Layer</span>
              <span className={styles.systemMeta}>
                MAINstream transmission network and institutional communication.
              </span>
            </div>
          </div>

        </div>

      </article>

        </div>

        {/* DATA HORIZON */}
        <div className={styles.bottomField} aria-hidden="true" />

      </div>
    </div>
  )
}