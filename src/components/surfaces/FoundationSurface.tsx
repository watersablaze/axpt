import styles from './FoundationSurface.module.css'
import SurfaceHeader from '@/components/surfaces/SurfaceHeader'

export default function FoundationSurface() {
  return (
    <div className={styles.foundationSurface}>

      <div className="surfaceFrame">

        <div className={styles.foundationInner}>

          <div className={styles.foundationContent}>

            <SurfaceHeader kicker="FOUNDATION" />

            <div className={styles.headlineBlock}>
              <div className={styles.doctrineCode}>FOUNDATION 01</div>

              <h2 className={styles.headline}>
                Conditions for continuity systems.
              </h2>
            </div>

            <div className={styles.divider} />

            <p className={styles.subline}>
              Custodial systems fracture when verification,
              memory, and authority diverge.
            </p>

            <div className={styles.domains} aria-label="Foundational domains">
              <article className={styles.domain}>
                <div className={styles.domainKicker}>GOVERNANCE CONTROL</div>
                <p>
                  Authority alignment through institutional transition.
                </p>
              </article>

              <article className={styles.domain}>
                <div className={styles.domainKicker}>VERIFICATION MEMORY</div>
                <p>
                  Proof, record, and operating state remain coherent.
                </p>
              </article>

              <article className={styles.domain}>
                <div className={styles.domainKicker}>CUSTODIAL CONTINUITY</div>
                <p>
                  Institutional state survives transfer and review.
                </p>
              </article>
            </div>

          </div>

        </div>

      </div>

    </div>
  )
}
