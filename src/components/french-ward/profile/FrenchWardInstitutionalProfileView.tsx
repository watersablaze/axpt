import styles from "./FrenchWardInstitutionalProfileView.module.css";

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
};

type Props = {
  profile: FrenchWardProfileContent;
  packageReference?: string;
  downloadHref?: string;
};

const sections = [
  ["identity", "Institutional Identity"],
  ["fields", "Fields of Activity"],
  ["practice", "Practice Areas"],
  ["principles", "Operating Principles"],
  ["continuum", "Operating Sequence"],
  ["record", "Publication Record"],
] as const;

function NumberedSection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={styles.section}>
      <div className={styles.sectionMarker}>
        <span>{number} / 06</span>
        <span>FRENCH-WARD</span>
      </div>
      <h2>{title}</h2>
      {children}
    </section>
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
          <span>INSTITUTIONAL FOLIO / {profile.version}</span>
        </div>

        <div className={styles.coverBody}>
          <p className={styles.eyebrow}>
            INSTITUTIONAL PROFILE · EDITION {String(profile.version).padStart(2, "0")}
          </p>
          <h1>{profile.displayName}</h1>
          <p className={styles.classification}>
            {profile.classification}
          </p>
          <p className={styles.coverDescription}>
            {profile.publicDescription}
          </p>
        </div>

        <div className={styles.coverFoot}>
          <span>{profile.reference}</span>
          <span>TRADE / AUTHORITY / PASSAGE</span>
        </div>
      </header>

      <div className={styles.paper}>
        <nav aria-label="Profile sections" className={styles.contents}>
          <span className={styles.contentsHeading}>
            PUBLICATION CONTENTS
          </span>
          <ol>
            {sections.map(([id, label], index) => (
              <li key={id}>
                <a href={`#${id}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className={styles.body}>
          <section className={styles.orientation}>
            <p className={styles.overline}>INSTITUTIONAL ORIENTATION</p>
            <p>{profile.orientation}</p>
          </section>

          <NumberedSection id="identity" number="01" title="Institutional Identity">
            <div className={styles.definition}>
              {profile.institutionalDefinition.map((item, index) => (
                <p key={index}>{item}</p>
              ))}
            </div>
          </NumberedSection>

          <NumberedSection id="fields" number="02" title="Fields of Activity">
            <ol className={styles.register}>
              {profile.domains.map((item, index) => (
                <li key={index}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </NumberedSection>

          <NumberedSection id="practice" number="03" title="Practice Areas">
            <ol className={styles.register}>
              {profile.practiceAreas.map((item, index) => (
                <li key={index}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </NumberedSection>

          <NumberedSection id="principles" number="04" title="Operating Principles">
            <ol className={styles.principles}>
              {profile.operatingPrinciples.map((item, index) => (
                <li key={index}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{item}</p>
                </li>
              ))}
            </ol>
          </NumberedSection>

          <NumberedSection id="continuum" number="05" title="Operating Sequence">
            <ol className={styles.continuum}>
              {profile.operatingContinuum.map((item, index) => (
                <li key={index}>
                  <span className={styles.continuumNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </NumberedSection>

          <NumberedSection id="record" number="06" title="Publication Record">
            <dl className={styles.record}>
              <div>
                <dt>Institution</dt>
                <dd>{profile.legalName}</dd>
              </div>
              <div>
                <dt>Reference</dt>
                <dd>{profile.reference}</dd>
              </div>
              <div>
                <dt>Edition</dt>
                <dd>{profile.version}</dd>
              </div>
              {packageReference && (
                <div>
                  <dt>CUP Reference</dt>
                  <dd>{packageReference}</dd>
                </div>
              )}
            </dl>
            <p className={styles.limitations}>
              This institutional publication does not itself establish
              a representative appointment, source-specific authority,
              transaction authority, or settlement instructions.
              Applicable permissions remain separately governed.
            </p>
            {downloadHref && (
              <a className={styles.download} href={downloadHref}>
                Download Profile · HTML ↗
              </a>
            )}
          </NumberedSection>
        </div>
      </div>

      <footer className={styles.footer}>
        <span>FRENCH-WARD, INC.</span>
        <span>{profile.reference}</span>
      </footer>
    </article>
  );
}
