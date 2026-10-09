import styles from "./FrenchWardInstitutionalProfileView.module.css";

/**
 * FW-PROFILE-VIS-1.2
 * Editorial publication only.
 * Institutional truth and permissions are resolved by callers.
 */
export type FrenchWardProfileContent = {
  reference: string;
  version: number;
  legalName: string;
  displayName: string;
  classification: string;
  publicDescription: string;
  orientation: string;
  institutionalDefinition: readonly string[];
  domains: readonly string[];
  practiceAreas: readonly string[];
  operatingPrinciples: readonly string[];
  operatingContinuum: readonly string[];
  custodianshipThesis?: string;
  transactionPreparation?: readonly string[];
  establishedSourceRelationships?: readonly string[];
};

type Props = {
  profile: FrenchWardProfileContent;
  packageReference?: string;
  downloadHref?: string;
};

function FolioHeading({ number, title, note }: {
  number: string;
  title: string;
  note: string;
}) {
  return (
    <header className={styles.folioHeading}>
      <span className={styles.folioNumber}>{number}</span>
      <div><h2>{title}</h2><p>{note}</p></div>
    </header>
  );
}

export function FrenchWardInstitutionalProfileView({
  profile,
  packageReference,
  downloadHref,
}: Props) {
  return (
    <article className={styles.publication}>
      <header className={styles.cover}>
        <div className={styles.masthead}>
          <span>{profile.legalName}</span>
          <span>Institutional Profile / {String(profile.version).padStart(2, "0")}</span>
        </div>

        <div className={styles.identity}>
          <h1>{profile.displayName}</h1>
          <p className={styles.classification}>
            {profile.classification}
          </p>
          <p className={styles.description}>
            {profile.publicDescription}
          </p>
        </div>

        <div className={styles.coverRecord}>
          <span>{profile.reference}</span>
          <span>French-Ward / Institutional Record</span>
        </div>
      </header>

      <div className={styles.paper}>
        <div className={styles.narrative}>
          <p className={styles.orientation}>
            {profile.orientation}
          </p>

          <div className={styles.definition}>
            {profile.institutionalDefinition.map((statement, index) => (
              <p key={index}>{statement}</p>
            ))}
          </div>
        </div>

        {profile.custodianshipThesis && (
          <p className={styles.custodianshipThesis}>
            {profile.custodianshipThesis}
          </p>
        )}

        {profile.establishedSourceRelationships &&
          profile.establishedSourceRelationships.length > 0 && (
            <section
              className={styles.sourceRelationships}
              aria-label="Established source relationships"
            >
              <h2>Established Source Relationships</h2>
              <div className={styles.definition}>
                {profile.establishedSourceRelationships.map((statement, index) => (
                  <p key={index}>{statement}</p>
                ))}
              </div>
            </section>
          )}

        <section className={styles.fieldsSection} aria-label="Fields of activity">
          <FolioHeading number="01" title="Fields of Activity" note="Institutional scope" />
          <div className={styles.fieldText}>
            {profile.domains.map((field, index) => (
              <span key={index}>{field}</span>
            ))}
          </div>
        </section>

        <section className={styles.practiceSection} aria-label="Practice areas">
          <FolioHeading number="02" title="Practice Areas" note="Commercial responsibilities" />
          <div className={styles.practiceNarrative}>
            {profile.practiceAreas.map((area, index) => (
              <p key={index}><span>{String(index + 1).padStart(2, "0")}</span>{area}</p>
            ))}
          </div>
        </section>

        <section className={styles.principlesSection} aria-label="Operating principles">
          <FolioHeading number="03" title="Operating Principles" note="The discipline of execution" />
          <ol className={styles.principleArticles}>
            {profile.operatingPrinciples.map((principle, index) => (
              <li key={index}>
                <span className={styles.principleIndex}>{String(index + 1).padStart(2, "0")}</span>
                <p>{principle}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.sequenceSection} aria-label="Operating sequence">
          <FolioHeading number="04" title="Operating Sequence" note="From source engagement to settlement" />
          <ol className={styles.sequenceFlow}>
            {profile.operatingContinuum.map((stage, index) => (
              <li key={index}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{stage}</strong>
              </li>
            ))}
          </ol>
        </section>

        {profile.transactionPreparation &&
          profile.transactionPreparation.length > 0 && (
            <section
              className={styles.preparation}
              aria-label="Transaction preparation"
            >
              <h2>Transaction Preparation</h2>
              <ol className={styles.preparationStages}>
                {profile.transactionPreparation.map((stage, index) => (
                  <li key={index}>
                    <span className={styles.number}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{stage}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

        <footer className={styles.colophon}>
          <div className={styles.details}>
            <span>{profile.legalName}</span>
            <span>
              {profile.reference} · Edition {profile.version}
            </span>
            {packageReference && <span>{packageReference}</span>}
          </div>

          <p className={styles.limitation}>
            This institutional publication does not itself establish
            a representative appointment, source-specific authority,
            transaction authority, or settlement instructions.
            Applicable permissions remain separately governed.
          </p>

          {downloadHref && (
            <a className={styles.download} href={downloadHref}>
              Download Profile · HTML
            </a>
          )}
        </footer>
      </div>
    </article>
  );
}
