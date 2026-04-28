import styles from './OriginSurface.module.css'

export default function OriginSurface() {
  return (
    <div className={styles.originSurface}>
      <div className={`surfaceFrame ${styles.originFrame}`}>
        <div className={styles.originGrid}>
          <div className={styles.leftField}>
            <div className={styles.declarationCluster}>
              <div className={styles.continuitySeal}>
                <span className={styles.sealText}>
                  HELD IN CONTINUITY
                </span>
              </div>

              <div className={styles.declaration}>
                <span className={styles.lead}>
                  Institutional continuity
                </span>

                <span className={styles.secondary}>
                  through custodial coordination
                </span>
              </div>
            </div>

            <div className={styles.operationalBlock}>
              <div
                className={styles.classificationPlate}
                aria-label="Classification"
              >
                <div className={styles.classificationKicker}>
                  OPERATIONAL LAYER
                </div>

                <div className={styles.classificationValue}>
                  CUSTODIAL COORDINATION ENGINE
                </div>
              </div>

              <div className={styles.systemMatrix}>
                <div className={styles.matrixHeader}>
                  <div className={styles.matrixState}>
                    VERIFICATION FIELD ONLINE
                  </div>
                </div>

                <div className={styles.matrixRow}>
                  <span>VERIFICATION LAYER</span>
                  <span>ONLINE</span>
                </div>

                <div className={styles.matrixRow}>
                  <span>GOVERNANCE ACCESS</span>
                  <span>RESTRICTED</span>
                </div>

                <div className={styles.matrixRow}>
                  <span>TREASURY OPERATIONS</span>
                  <span>STAGED</span>
                </div>

                <div className={styles.matrixRow}>
                  <span>INSTITUTIONAL RECORDS</span>
                  <span>MAINTAINED</span>
                </div>
              </div>

            </div>
          </div>

          <div className={styles.rightField}>
            <div className={styles.originBoot}>
              <div className={styles.sigilStage} aria-hidden="true">
                <div className={styles.sigilField} />
                <div className={styles.fieldCompression} />

                <div className={styles.custodyLattice}>
                  <span className={styles.traceVertical} />
                  <span className={styles.traceDiagonal} />
                  <span className={styles.arcFragmentA} />
                  <span className={styles.arcFragmentB} />
                </div>

                <div className={styles.sigilDrift}>
                  <img
                    src="/sigil/v4/axis_sigil_full.png"
                    alt=""
                    className={styles.globe}
                    draggable={false}
                  />

                  <img
                    src="/sigil/v4/axpt_sigil_V4_wing_show.png"
                    alt=""
                    className={styles.wings}
                    draggable={false}
                  />

                  <img
                    src="/sigil/v4/axis_sigil_full.png"
                    alt="AXPT Sigil"
                    className={styles.seal}
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
