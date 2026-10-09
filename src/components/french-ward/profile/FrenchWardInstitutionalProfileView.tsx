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
};

type Props = {
  profile: FrenchWardProfileContent;
  packageReference?: string;
  downloadHref?: string;
};

function Register({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <div className={styles.register}>
      <h2>{title}</h2>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function NumberedRegister({
  title,
  items,
  ordered = false,
}: {
  title: string;
  items: readonly string[];
  ordered?: boolean;
}) {
  const entries = items.map((item, index) => (
    <li key={index}>
      <span className={styles.number}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <span>{item}</span>
    </li>
  ));

  return (
    <div className={styles.register}>
      <h2>{title}</h2>
      {ordered ? <ol>{entries}</ol> : <ul>{entries}</ul>}
    </div>
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

        <div className={styles.practicePair}>
          <Register
            title="Fields of Activity"
            items={profile.domains}
          />
          <Register
            title="Practice Areas"
            items={profile.practiceAreas}
          />
        </div>

        <div className={styles.operatingPair}>
          <NumberedRegister
            title="Operating Principles"
            items={profile.operatingPrinciples}
          />
          <NumberedRegister
            title="Operating Sequence"
            items={profile.operatingContinuum}
            ordered
          />
        </div>

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
