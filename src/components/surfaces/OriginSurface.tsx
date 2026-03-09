'use client'

import styles from './OriginSurface.module.css'

export default function OriginSurface() {

  return (

    <section
      className={`surface ${styles.container}`}
      data-layer="ORIGIN"
      aria-label="Entry Layer"
    >

      <div className="surfaceFrame">

        {/* TRUE AXIS LOCK */}
        <div className={styles.axisStack}>

          <div className={styles.mount}>

            {/* CLASSIFICATION */}
            <div
              className={styles.classificationPlate}
              aria-label="Classification"
            >
              <div className={styles.classificationKicker}>
                INSTRUMENT
              </div>

              <div className={styles.classificationValue}>
                CUSTODIAL ENGINE
              </div>
            </div>


            {/* SIGIL CORE — BOOT SEQUENCE */}
            <div className={styles.originBoot}>

              <div className={styles.sigilStage} aria-hidden="true">

                <div className={styles.sigilField} />

                <div className={styles.sigilDrift}>

                  {/* AXIS FIELD GLOBE */}
                  <img
                    src="/sigil/v4/axis_sigil_full.png"
                    alt=""
                    className={styles.globe}
                    draggable={false}
                  />

                  {/* WINGS */}
                  <img
                    src="/sigil/v4/axpt_sigil_V4_wing_show.png"
                    alt=""
                    className={styles.wings}
                    draggable={false}
                  />

                  {/* CENTRAL SEAL */}
                  <img
                    src="/sigil/v4/axis_sigil_full.png"
                    alt="AXPT Sigil"
                    className={styles.seal}
                    draggable={false}
                  />

                </div>

              </div>

            </div>


            {/* IDENTITY */}
            <div className={styles.textBlock}>

              <div className={styles.identity}>

                <span className={styles.identityName}>
                  AXIS POINT
                </span>

                <span className={styles.identityDesc}>
                  Held in Continuity
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>

  )

}