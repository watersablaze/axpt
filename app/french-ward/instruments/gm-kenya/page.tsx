import styles from "./page.module.css";
import { InstrumentShell } from "@/components/instruments/InstrumentShell";
import { RoyalRelationshipMap } from "@/components/french-ward/gm/RoyalRelationshipMap";
import { RelationshipUnderstanding } from "@/components/french-ward/gm/RelationshipUnderstanding";
import { AuthorityArchitecture } from "@/components/french-ward/gm/AuthorityArchitecture";
import { EconomicCorridor } from "@/components/french-ward/gm/EconomicCorridor";
import { FutureBody } from "@/components/french-ward/gm/FutureBody";
import { DeliberationField } from "@/components/french-ward/gm/DeliberationField";

const movements = [
  { index: "01", label: "Relationship", active: true },
  { index: "02", label: "Architecture" },
  { index: "03", label: "Economic Corridor" },
  { index: "04", label: "Future Body" },
  { index: "05", label: "Deliberation" },
];

export default function GreatMotherInstrumentPage() {
  return (
    <InstrumentShell
      eyebrow="French-Ward / Controlled Instrument"
      title="Framework of Royal Custodianship"
      subtitle="Ancestral Restoration & Global Economic Cooperation"
      reference="GM-KENYA-RCF-001"
      version="V1"
      status="UNDER DELIBERATION"
      movements={movements}
    >
      <section className={styles.movement} aria-labelledby="relationship-heading">
        <header className={styles.movementHeader}>
          <span className={styles.movementNumber}>01</span>
          <div>
            <p className={styles.movementKicker}>The Relationship</p>
            <h2 id="relationship-heading">Relationship before transaction.</h2>
            <p className={styles.movementLead}>
              The initiating proposition is understood as a Royal and custodial
              relationship through which trade, restoration, projects and
              continuing return may be responsibly developed.
            </p>
          </div>
        </header>

        <div className={styles.relationshipField}>
          <RoyalRelationshipMap />
        </div>

        <RelationshipUnderstanding />
      </section>

      <section
        className={styles.movement}
        aria-labelledby="architecture-heading"
      >
        <header className={styles.movementHeader}>
          <span className={styles.movementNumber}>02</span>

          <div>
            <p className={styles.movementKicker}>The Architecture</p>

            <h2 id="architecture-heading">
              Authority must have a perimeter.
            </h2>

            <p className={styles.movementLead}>
              Custodianship is not transferred sovereignty. The relationship
              becomes executable only when retained, shared, delegated and
              prohibited authority are made explicit.
            </p>
          </div>
        </header>

        <div className={styles.architectureField}>
          <AuthorityArchitecture />
        </div>
      </section>

      <section
        className={styles.movement}
        aria-labelledby="corridor-heading"
      >
        <header className={styles.movementHeader}>
          <span className={styles.movementNumber}>03</span>

          <div>
            <p className={styles.movementKicker}>The Economic Corridor</p>

            <h2 id="corridor-heading">
              Existence is not passage.
            </h2>

            <p className={styles.movementLead}>
              Gold becomes commercially meaningful only when source authority,
              evidence, logistics, receiving capacity, assay and settlement are
              assembled into a governed path.
            </p>
          </div>
        </header>

        <div className={styles.corridorField}>
          <EconomicCorridor />
        </div>
      </section>

      <section
        className={styles.movement}
        aria-labelledby="future-heading"
      >
        <header className={styles.movementHeader}>
          <span className={styles.movementNumber}>04</span>

          <div>
            <p className={styles.movementKicker}>The Future Body</p>

            <h2 id="future-heading">
              The relationship should leave something behind.
            </h2>

            <p className={styles.movementLead}>
              Projects, digital infrastructure, cultural memory and continuing
              family relationship are treated as the productive body that
              should remain after individual transactions are complete.
            </p>
          </div>
        </header>

        <div className={styles.futureField}>
          <FutureBody />
        </div>
      </section>

      <section
        className={styles.movement}
        aria-labelledby="deliberation-heading"
      >
        <header className={styles.movementHeader}>
          <span className={styles.movementNumber}>05</span>

          <div>
            <p className={styles.movementKicker}>Deliberation</p>

            <h2 id="deliberation-heading">
              Understanding must become attributable response.
            </h2>

            <p className={styles.movementLead}>
              Confirmed matters, shared understandings, proposals and open
              questions are distinguished so that alignment may emerge through
              visible institutional response rather than assumption.
            </p>
          </div>
        </header>

        <div className={styles.deliberationField}>
          <DeliberationField />
        </div>
      </section>
    </InstrumentShell>
  );
}
