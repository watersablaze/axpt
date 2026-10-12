/* PROFILE-C6D — consolidated publication structure; substantive source arrays unchanged. */
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
  corporateCoordinates: Readonly<{
    registrationJurisdiction: string;
    registrationNumber: string;
    corporateStatus: string;
    principalAddress: string;
    telephone: string;
  }>;
  commercialActivities: readonly string[];
  publicDescription: string;
  orientation: string;
  institutionalDefinition: readonly string[];
  leadership: readonly { name: string; title: string; responsibility: string }[];
  counterpartyEngagement: readonly string[];
  counterpartyDueDiligence: string;
  documentaryReadiness: readonly string[];
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

function ProfileSectionMark({ id }: { id: string }) {
  const shapes: Record<string, React.ReactNode> = {
    "fw-source-heading": <><path d="M3 17h7l4-5h7M3 7h7l4 5h7"/><circle cx="14" cy="12" r="1.4"/></>,
    "fw-commercial-practice-heading": <><path d="M3 5v14h18M7 14l4-4 4 3 5-7"/><circle cx="20" cy="6" r="1.4"/></>,
    "fw-governing-passage-heading": <><path d="M5 3h14v18H5zM9 8h6M9 12h6M9 16h4"/></>,
    "fw-engagement-heading": <><path d="M3 12h12m-5-5 5 5-5 5M18 5h3v14h-3"/></>,
    "fw-readiness-heading": <><path d="M5 3h10l4 4v14H5zM15 3v5h4M8 14l3 3 5-6"/></>,
  };
  return <span className={styles.c6cSectionMark} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square" strokeLinejoin="miter">{shapes[id] ?? <path d="M4 12h16"/>}</svg></span>;
}

function FolioHeading({ number, title, note, id }: {
  number: string;
  title: string;
  note: string;
  id: string;
}) {
  return (
    <header className={styles.folioHeading}>
      <span className={styles.c6cSectionCoordinate}><span className={styles.folioNumber}>{number}</span><ProfileSectionMark id={id} /></span>
      <div className={styles.folioIdentity}><h2 id={id}>{title}</h2><p>{note}</p></div>
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
          <span className={styles.c6e1DocumentIdentity}><strong>Edition {String(profile.version).padStart(2, "0")}</strong><small>{profile.reference}</small></span>
        </div>

        <div className={styles.identity}>
          <h1>Custodianship &amp; Commercial Practice</h1>
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

      <details className={styles.c6cLeadershipDisclosure}>
        <summary><span className={styles.c6cLeadershipSummaryMark} aria-hidden="true">FW</span><span className={styles.c6cLeadershipSummaryText}><strong>Institutional Leadership</strong><small>Officers and responsibilities</small></span><span className={styles.c6cLeadershipChevron} aria-hidden="true" /></summary>
        <div className={styles.c6cLeadershipBody}>
        <section className={styles.leadershipSection} aria-labelledby="fw-leadership-heading">
          <div className={styles.c6cLeadershipHeader}>
              <span className={styles.c6cLeadershipMark} aria-hidden="true">FW</span>
              <div><h2 id="fw-leadership-heading">Institutional Leadership</h2><p>Officers and responsibilities</p></div>
            </div>
          <div className={styles.officerRegister}>
            {profile.leadership.map((officer, index) => (
              <div className={styles.officerDrawer} key={officer.name}>
                <span className={styles.officerIndex}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.officerInsignia} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    {index === 0 ? (
                      <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.4 4.6-4.6 2.4 2.4-4.6z" /></>
                    ) : index === 1 ? (
                      <><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h6a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8" /></>
                    ) : (
                      <><path d="M12 3v17M5 7h14M6 7l-3 6h6L6 7Zm12 0-3 6h6l-3-6ZM8 21h8" /></>
                    )}
                  </svg>
                </span>
                <div className={styles.officerIdentity}>
                  <h3>{officer.name}</h3>
                  <p className={styles.officerTitle}>{officer.title}</p>
                </div>
                <p className={styles.officerResponsibility}>{officer.responsibility}</p>
              </div>
            ))}
          </div>
        </section>
        </div>
      </details>

      <section className={styles.entryBridge} aria-label="Institutional record orientation">
        <div className={styles.bridgeIndex}>
          <span>01 / Institutional Record</span>
          <span>{profile.reference}</span>
        </div>
        <div className={styles.bridgeRule} aria-hidden="true" />
        <div className={styles.scopeComposition}>
          <div className={styles.scopeIdentity}>
            <span className={styles.scopeCoordinate}>FW / PUBLICATION ENTRY</span>
            <h2 className={styles.bridgeTitle}>Publication Scope</h2>
          </div>
          <p className={styles.bridgeBoundary}>
            Specific appointments, source authorities, commercial terms, and
            settlement instructions remain governed by their respective instruments.
          </p>
        </div>
      </section>

      <div className={styles.paper}>
        <div className={styles.narrative}>
          <div className={styles.orientationAxis}>
            <span className={styles.narrativeCoordinate}>INSTITUTIONAL PREMISE / 01</span>
            <div className={styles.orientation}>
              {(() => {
                const sentences = profile.orientation.match(/^(.+?\.)\s+(.+)$/);
                return sentences ? (
                  <>
                    <p className={styles.premiseLead}>{sentences[1]}</p>
                    <p className={styles.premiseContinuation}>{sentences[2]}</p>
                  </>
                ) : <p className={styles.premiseLead}>{profile.orientation}</p>;
              })()}
            </div>
          </div>
          <div className={styles.definitionAxis}>
            <div className={styles.definitionCaption}>
              <span>Institutional Definition</span>
              <span>Corporate identity / governing capacity / systems</span>
            </div>
            <div className={styles.definition}>
              {profile.institutionalDefinition.map((statement, index) => (
                <div className={styles.definitionEntry} key={index}>
                  <span className={styles.definitionIndex}>{String(index + 1).padStart(2, "0")}</span>
                  <p>{statement}</p>
                </div>
              ))}
            </div>
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
              aria-labelledby="fw-source-heading"
            >
              <FolioHeading number="01" id="fw-source-heading" title="Established Source Relationships" note="Source relationship and governed authority" />
              <div className={styles.sourceRegister}>
                <div className={styles.sourceIdentity}>
                  <span className={styles.sourceCoordinate}>ESTABLISHED RELATIONSHIP / MALI</span>
                  <h3>Coopérative de Bafoula</h3>
                  <span className={styles.sourceTerritory}>Republic of Mali / Source-side commercial relationship</span>
                </div>
                <div className={styles.sourceNarrative}>
                  <div className={styles.sourcePrimary}>
                    <span className={styles.sourceRegisterLabel}>01 / COMMERCIAL RELATIONSHIP</span>
                    <p>{profile.establishedSourceRelationships[0]}</p>
                  </div>
                  <details className={styles.c6eSourceDetail}>
                    <summary>
                      <span className={styles.c6eActionGlyph} aria-hidden="true" />
                      <span>Institutional practice &amp; governing instruments</span>
                      <span className={styles.c6eActionLabel}>View supporting record</span>
                    </summary>
                    <div className={styles.c6eSourceDetailBody}>
                  <div className={styles.sourcePractice}>
                    <span className={styles.sourceRegisterLabel}>02 / INSTITUTIONAL PRACTICE</span>
                    <p>{profile.establishedSourceRelationships[1]}</p>
                  </div>
                  <div className={styles.sourceBoundary}>
                    <span className={styles.sourceRegisterLabel}>03 / GOVERNING INSTRUMENTS</span>
                    <p>{profile.establishedSourceRelationships[2]}</p>
                  </div>
                    </div>
                  </details>
                </div>
              </div>
            </section>
          )}


        {/* C5: Three spatial movements. Source arrays and their order are unchanged. */}
        <section className={styles.c5Capacity} aria-labelledby="fw-commercial-practice-heading">
          <FolioHeading number="02" id="fw-commercial-practice-heading" title="Commercial Practice" note="Commercial activities and responsibilities" />
          <div className={styles.c6dPractice}>
            <div className={styles.c6dPracticeContext}>
              <p className={styles.c6dPracticeLead}>French-Ward undertakes international trade and commodity commerce through source relationships, commercial governance, and transaction execution.</p>
              <div className={styles.c6dPracticeFields}>
                <span className={styles.c5Eyebrow}>Fields of activity</span>
                <p>{profile.domains.join(" · ")}</p>
              </div>
            </div>
            <div className={styles.c6dPracticeActivities}>
              <span className={styles.c5Eyebrow}>Commercial responsibilities</span>
              <ol className={styles.c5Responsibilities}>
                {profile.practiceAreas.map((area,index)=>(
                  <li key={index}><span>{String(index+1).padStart(2,"0")}</span><p>{area}</p></li>
                ))}
              </ol>
            </div>
          </div>
          <div className={styles.c6dPracticeStandards}>
            <details className={styles.c6dStandardsDisclosure}>
              <summary><span className={styles.c6dStandardsIcon} aria-hidden="true">§</span><span>Commercial standards and execution conditions</span><span className={styles.c6dDisclosureCaret} aria-hidden="true" /></summary>
              <div className={styles.c6dStandardsContent}>
                <p>Commercial commitments are subject to documented authority, agreed terms, and execution requirements.</p>
                <ol className={styles.c5Clauses} aria-label="Commercial operating principles">
                  {profile.operatingPrinciples.map((principle,index)=>(
                    <li key={index}><span>{String(index+1).padStart(2,"0")}</span><p>{principle}</p></li>
                  ))}
                </ol>
              </div>
            </details>
            <div className={styles.c6dPassageLine}>
              <span className={styles.c5Eyebrow}>Source to settlement</span>
              <ol className={styles.c5Stages}>
                {profile.operatingContinuum.map((stage,index)=>(
                  <li key={index}><span>{String(index+1).padStart(2,"0")}</span><strong>{stage}</strong></li>
                ))}
              </ol>
            </div>
          </div>
        </section>



        <section className={styles.c5Engagement} aria-labelledby="fw-engagement-heading">
          <FolioHeading number="03" id="fw-engagement-heading" title="Working With French-Ward" note="Counterparty engagement" />
          <div className={styles.c5EngagementComposition}>
            <div className={styles.c5EngagementLead}>
              <p className={styles.c5EngagementLeadText}>Commercial inquiries are reviewed and qualified before transaction preparation.</p>
              <div className={styles.c5EngagementStatements}>
                {profile.counterpartyEngagement.map((statement,index)=>(
                  <div key={index}><span>{String(index+1).padStart(2,"0")}</span><p>{statement}</p></div>
                ))}
              </div>
</div>
            {profile.transactionPreparation && profile.transactionPreparation.length>0 && (
              <div className={styles.c5QualificationPath}>
                <span className={styles.c5Eyebrow}>Engagement stages</span>
                <ol>
                  {profile.transactionPreparation.map((stage,index)=>(
                    <li key={index}><span>{String(index+1).padStart(2,"0")}</span><strong>{stage}</strong></li>
                  ))}
                </ol>
              </div>
            )}
          </div>
          <div className={styles.c6dDueDiligence} aria-label="Counterparty due diligence">
            <div className={styles.c6dDueHeading}>
              <span className={styles.c6dDueIcon} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M5 3h10l4 4v14H5zM15 3v5h4M8 13h8M8 17h6"/><circle cx="18" cy="18" r="3"/></svg></span>
              <h3>Counterparty Due Diligence</h3>
            </div>
            <p>{profile.counterpartyDueDiligence}</p>
          </div>
          <div className={styles.c6dReadiness} aria-label="Documentation and transaction readiness">
            <div className={styles.c6dReadinessIntro}>
              <span className={styles.c5Eyebrow}>Documentation &amp; Transaction Readiness</span>
              <h3>Documentary requirements</h3>
              <p>Transaction-specific documents and authorizations are established before execution.</p>
            </div>
            <ol className={styles.c5Evidence}>
              {profile.documentaryReadiness.map((statement,index)=>(
                <li key={index}><span>{String(index+1).padStart(2,"0")}</span><p>{statement}</p></li>
              ))}
            </ol>
          </div>
        </section>



        <section className={styles.c6bCorporateRecord} aria-labelledby="fw-corporate-coordinates">
          <div className={styles.c6bCorporateHead}>
            <span>Corporate record / French-Ward, Inc.</span>
            <h2 id="fw-corporate-coordinates">Corporate &amp; Commercial Coordinates</h2>
          </div>
          <div className={styles.c6bCorporateGrid}>
            <dl className={styles.c6bCorporateDetails}>
              <div><dt>Jurisdiction</dt><dd>{profile.corporateCoordinates.registrationJurisdiction}</dd></div>
              <div><dt>Florida registration</dt><dd>{profile.corporateCoordinates.registrationNumber}</dd></div>
              <div><dt>Corporate status</dt><dd>{profile.corporateCoordinates.corporateStatus}</dd></div>
              <div><dt>Principal address</dt><dd>{profile.corporateCoordinates.principalAddress}</dd></div>
              <div><dt>Telephone</dt><dd><a href="tel:+15183810306">{profile.corporateCoordinates.telephone}</a></dd></div>
            </dl>
            <div className={styles.c6bActivities}>
              <span>Primary commercial activities</span>
              <ul>{profile.commercialActivities.map(activity => <li key={activity}>{activity}</li>)}</ul>
            </div>
          </div>
        </section>

        <footer className={styles.colophon}>
          <div className={styles.details}>
            <span>{profile.legalName}</span>
            <span>
              {profile.reference} · Edition {profile.version}
            </span>
            {packageReference && <span>{packageReference}</span>}
          </div>

          <p className={styles.limitation}>
            This publication does not confer representative, source-specific,
            or transaction authority, or establish settlement instructions.
            Those matters remain subject to their governing instruments.
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
