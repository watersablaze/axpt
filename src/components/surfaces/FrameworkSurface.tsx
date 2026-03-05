'use client'

import styles from './FrameworkSurface.module.css'
import SurfaceHeader from '@/components/surfaces/SurfaceHeader'

export default function FrameworkSurface() {

  return (

    <section
      className={`surface ${styles.frameworkSurface}`}
      data-layer="FRAMEWORK"
      aria-label="Framework"
    >

      <div className="surfaceFrame">

        <SurfaceHeader kicker="FRAMEWORK" />

        <h2 className={styles.headline}>
          The system map beneath the portal surface.
        </h2>

        <p className={styles.subline}>
          Three layers that stay legible under pressure —
          principle, authority, execution.
        </p>

        <div className={styles.grid}>

          <article className={styles.slab}>
            <h3 className={styles.slabTitle}>CONTINUITY</h3>
            <p className={styles.slabText}>
              Sacred principle + constitutional horizon.
            </p>
          </article>

          <article className={styles.slab}>
            <h3 className={styles.slabTitle}>GOVERNANCE</h3>
            <p className={styles.slabText}>
              Council authority + policy enforcement.
            </p>
          </article>

          <article className={styles.slab}>
            <h3 className={styles.slabTitle}>SYSTEMS</h3>
            <p className={styles.slabText}>
              Policy becomes action and permanent record.
            </p>
          </article>

        </div>

      </div>

    </section>
  )
}