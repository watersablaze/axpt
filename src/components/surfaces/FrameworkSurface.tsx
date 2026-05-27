import styles from './FrameworkSurface.module.css'
import SurfaceHeader from '@/components/surfaces/SurfaceHeader'

const LAYERS = [
  {
    index: '01',
    title: 'Continuity',
    meta: 'Principle Layer',
    text: 'Defines the invariant orientation the system is designed to preserve under pressure.',
  },
  {
    index: '02',
    title: 'Governance',
    meta: 'Authority Layer',
    text: 'Translates continuity into mandate, permissions, oversight, and institutional responsibility.',
  },
  {
    index: '03',
    title: 'Systems',
    meta: 'Execution Layer',
    text: 'Converts mandate into recorded action across ledger, treasury, and communication infrastructure.',
  },
]

const MODULES = [
  ['Ledger Engine', 'Custodial accounting and institutional transaction record.'],
  ['Treasury Coordination', 'Settlement orchestration, asset custody, and capital allocation.'],
  ['Broadcast Layer', 'Institutional communication and public transmission surface.'],
]

export default function FrameworkSurface() {
  return (
    <div className={styles.frameworkSurface}>
      <div className="surfaceFrame">
        <div className={styles.frameworkShell}>

          <div className={styles.frameworkIntro}>
            <SurfaceHeader kicker="FRAMEWORK" />

            <h2 className={styles.headline}>
              Institutional continuity topology.
            </h2>

            <p className={styles.subline}>
              Three structural layers define how principle becomes authority,
              and authority becomes recorded action.
            </p>
          </div>

          <div className={styles.sectionCut}>

            <div className={styles.layerStack}>
              {LAYERS.map((layer) => (
                <article key={layer.index} className={styles.layerRow}>
                  <span className={styles.layerIndex}>{layer.index}</span>

                  <div className={styles.layerBody}>
                    <div className={styles.layerTop}>
                      <h3>{layer.title}</h3>
                      <span>{layer.meta}</span>
                    </div>

                    <p>{layer.text}</p>
                  </div>
                </article>
              ))}
            </div>

            <aside className={styles.executionPanel}>
              <div className={styles.panelLabel}>
                Execution Modules
              </div>

              <div className={styles.executionList}>
                {MODULES.map(([title, text]) => (
                  <div key={title} className={styles.executionItem}>
                    <span className={styles.executionTitle}>{title}</span>
                    <span className={styles.executionText}>{text}</span>
                  </div>
                ))}
              </div>
            </aside>

          </div>

        </div>
      </div>
    </div>
  )
}