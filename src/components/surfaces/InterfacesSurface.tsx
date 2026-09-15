import styles from './InterfacesSurface.module.css'

export default function InterfacesSurface() {
  return (
    <div
      className={styles.interfacesSurface}
    >
      <div className={styles.interfacesInner}>

        {/* 01 — DECLARATION */}
        <header className={styles.declaration}>
          <h2>
            Conditions become consequential
            <span> at the point of action.</span>
          </h2>
        </header>

        {/* MOBILE — CAUSAL PASSAGE */}
        <section
          className={styles.mobilePassage}
          aria-label="Interface causal passage"
        >
          <div className={styles.mobilePassageState}>
            <span className={styles.mobilePassageLabel}>
              Before action
            </span>

            <p className={styles.mobilePassageText}>
              Verify what is known.
              <br />
              Authorize who may act.
            </p>
          </div>

          <div
            className={styles.mobileAperture}
            aria-label="Point of Action"
          >
            <span className={styles.mobileApertureLabel}>
              Point of Action
            </span>

            <span
              className={styles.mobileApertureLine}
              aria-hidden="true"
            />

            <strong className={styles.mobileAct}>
              Act
            </strong>

            <span className={styles.mobileOccurrence}>
              something occurs.
            </span>

            <span
              className={styles.mobileApertureLine}
              aria-hidden="true"
            />
          </div>

          <div className={styles.mobilePassageState}>
            <span className={styles.mobilePassageLabel}>
              After action
            </span>

            <p className={styles.mobilePassageText}>
              Conditions have changed.
              <br />
              What occurred remains known.
            </p>
          </div>
        </section>

        {/* 02 — CONSEQUENCE FIELD */}
        <div
          className={styles.consequenceField}
          aria-label="Conditions before and after action"
        >

          {/* BEFORE */}
          <div className={styles.beforeField}>
            <span className={styles.fieldRegistration}>
              Before action
            </span>

            <div className={styles.condition}>
              <strong>Verify</strong>
              <span>what is known.</span>
            </div>

            <div className={styles.condition}>
              <strong>Authorize</strong>
              <span>who may act.</span>
            </div>
          </div>

          {/* EVENT */}
          <div className={styles.eventField}>
            <span className={styles.eventRegistration}>
              Point of Action
            </span>

            <div className={styles.event}>
              <span
                className={styles.eventPoint}
                aria-hidden="true"
              />

              <div className={styles.eventStatement}>
                <strong>Act</strong>
                <span>something occurs.</span>
              </div>
            </div>
          </div>

          {/* AFTER */}
          <div className={styles.afterField}>
            <span className={styles.fieldRegistration}>
              After action
            </span>

            <div className={styles.condition}>
              <strong>Consequence</strong>
              <span>conditions have changed.</span>
            </div>

            <div className={styles.condition}>
              <strong>Record</strong>
              <span>what occurred remains known.</span>
            </div>
          </div>

        </div>

        {/* 03 — INSTITUTIONAL DEFINITION */}
        <footer className={styles.interfaceDefinition}>
          <span className={styles.definitionLabel}>
            INTERFACE
          </span>

          <p>
            An interface is where established conditions
            pass into action and consequence.
          </p>
        </footer>

      </div>
    </div>
  )
}
