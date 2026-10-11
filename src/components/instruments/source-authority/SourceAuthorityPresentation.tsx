import type {
  SourceAuthorityPresentationAssertion,
  SourceAuthorityPresentationProjection,
} from "@/domains/instruments/source-authority";

import { bafoulaSourceAuthorityNarrative } from "./bafoulaSourceAuthorityNarrative";
import styles from "./SourceAuthorityPresentation.module.css";

type SourceAuthorityPresentationProps = Readonly<{
  projection: SourceAuthorityPresentationProjection;
}>;

type ArticleMode =
  | "declarative"
  | "contextual"
  | "operational"
  | "diligence";

type ProfileArticleProps = Readonly<{
  id: string;
  numeral: string;
  articleLabel: string;
  title: string;
  assertion: SourceAuthorityPresentationAssertion | null;
  children?: React.ReactNode;
  mode?: ArticleMode;
}>;

function formatStanding(value: string) {
  return value.replaceAll("_", " ");
}

function findAssertion(
  projection: SourceAuthorityPresentationProjection,
  assertionClass: SourceAuthorityPresentationAssertion["assertionClass"],
) {
  return projection.assertions.find(
    (assertion) =>
      assertion.assertionClass === assertionClass,
  ) ?? null;
}

const sourceAuthorityArticles = [
  ["I", "Source Identity", "institutional-identity"],
  ["II", "Continuity", "historical-standing"],
  ["III", "Sovereign Context", "sovereign-regulatory-context"],
  ["IV", "Source Geography", "geographic-source-context"],
  ["V", "Commercial Channel", "international-commercial-channel"],
  ["VI", "Protection", "community-stewardship"],
  ["VII", "Operating Doctrine", "operating-principles"],
  ["VIII", "Documentary Standing", "documentary-recognition-register"],
  ["IX", "Instrument Boundary", "instrument-scope-boundary"],
] as const;

function recognitionState(
  assertion: SourceAuthorityPresentationAssertion | null,
) {
  if (!assertion?.recognition) {
    return "UNREVIEWED";
  }

  return formatStanding(
    assertion.recognition.outcome,
  );
}

function ProfileArticle({
  id,
  numeral,
  articleLabel,
  title,
  assertion,
  children,
  mode = "declarative",
}: ProfileArticleProps) {
  if (!assertion && !children) {
    return null;
  }

  return (
    <section
      id={id}
      className={[
        styles.article,
        mode === "declarative"
          ? styles.articleDeclarative
          : mode === "contextual"
            ? styles.articleContextual
            : mode === "operational"
              ? styles.articleOperational
              : styles.articleDiligence,
      ].join(" ")}
    >
      <aside className={styles.articleMargin}>
        <span className={styles.articleNumeral}>
          {numeral}
        </span>

        {assertion ? (
          <div className={styles.articleMeta}>
            <small>{assertion.reference}</small>

            <span>
              {recognitionState(assertion)}
            </span>

            <span>
              Evidence{" "}
              {assertion.evidence.length === 0
                ? "0"
                : assertion.evidence.length}
            </span>
          </div>
        ) : null}
      </aside>

      <div className={styles.articleMatter}>
        <header className={styles.articleHeader}>
          <p>{articleLabel}</p>
          <h2>{title}</h2>
        </header>

        {assertion ? (
          <p className={styles.articleStatement}>
            {assertion.statement}
          </p>
        ) : null}

        {children}

        {assertion?.scope ? (
          <details className={styles.governanceNote}>
            <summary>
              Governance notation
            </summary>

            <p>{assertion.scope}</p>
          </details>
        ) : null}
      </div>
    </section>
  );
}

export function SourceAuthorityPresentation({
  projection,
}: SourceAuthorityPresentationProps) {
  const {
    identity,
    standing,
    evidenceRegister,
    capabilities,
    boundary,
  } = projection;

  const subject =
    identity.subject;

  const profileParticulars =
    identity.profileParticulars;

  const cooperativeRepresentative =
    [
      profileParticulars.authorizedRepresentativeName,
      profileParticulars.authorizedRepresentativeCapacity,
    ]
      .filter(
        (value): value is string =>
          value !== null,
      )
      .join(" · ");

  const institutionalIdentity =
    findAssertion(
      projection,
      "INSTITUTIONAL_IDENTITY",
    );

  const sourceAuthority =
    findAssertion(
      projection,
      "SOURCE_AUTHORITY",
    );

  const operationalCapability =
    findAssertion(
      projection,
      "OPERATIONAL_CAPABILITY",
    );

  const commercialRelationship =
    findAssertion(
      projection,
      "COMMERCIAL_RELATIONSHIP",
    );

  const sovereignContext =
    findAssertion(
      projection,
      "SOVEREIGN_CONTEXT",
    );

  const recognizedAssertions =
    projection.assertions.filter(
      (assertion) =>
        assertion.recognition !== null,
    ).length;

  return (
    <article
      id="source-authority-top"
      className={styles.instrument}
      aria-label={`${subject.displayName} Source Authority Profile`}
    >
      <header className={styles.crown}>
        <div
          className={styles.crownAtmosphere}
          aria-hidden="true"
        />

        <img
          className={styles.maliTerritory}
          src="/instruments/source-authority/mali-outline.svg"
          alt=""
          aria-hidden="true"
        />

        <div className={styles.crownNotation}>
          <span>AXPT · Digital Instruments</span>
          <span>Source Authority Profile</span>
        </div>

        <div className={styles.crownBody}>
          <div className={styles.crownIdentity}>
            <p className={styles.crownJurisdiction}>
              Republic of Mali
            </p>

            <h1>{subject.displayName}</h1>

            <p className={styles.crownCapacity}>
              {subject.institutionalCapacity}
            </p>

            <p className={styles.crownAssociation}>
              The Associated Miners of Mali
            </p>

            <p className={styles.crownLead}>
              {subject.displayName} is a Malian cooperative
              operating within the mineral economy of the{" "}
              {subject.jurisdiction}, coordinating source
              relationships, commodity preparation, and
              governed commercial pathways.
            </p>
          </div>

          <dl className={styles.crownRegister}>
            <div>
              <dt>Reference</dt>
              <dd>
                {identity.instrumentReference}
              </dd>
            </div>

            <div>
              <dt>Instrument Version</dt>
              <dd>{identity.versionNumber}</dd>
            </div>

            <div>
              <dt>
                {projection.audience === "OPERATOR"
                  ? "Standing"
                  : "Profile Status"}
              </dt>
              <dd className={styles.crownStanding}>
                {projection.audience === "OPERATOR"
                  ? formatStanding(standing)
                  : profileParticulars.documentStatus}
              </dd>
            </div>
          </dl>
        </div>

        <dl className={styles.particulars}>
          <div>
            <dt>Jurisdiction</dt>
            <dd>{subject.jurisdiction}</dd>
          </div>

          <div>
            <dt>Operating Base</dt>
            <dd>{subject.operatingBase}</dd>
          </div>

          <div>
            <dt>Sector</dt>
            <dd>{subject.sector}</dd>
          </div>

          <div>
            <dt>Principal Commodity Activity</dt>
            <dd>
              {subject.principalCommodityActivity.join(
                " · ",
              )}
            </dd>
          </div>
        </dl>
      </header>

      <div className={styles.instrumentFrame}>
        <aside
          className={styles.instrumentRail}
          aria-label="Source Authority Instrument contents"
        >
          <div className={styles.railIdentity}>
            <span>Source Authority</span>
            <strong>{identity.instrumentReference}</strong>
            <small>
              {projection.audience === "OPERATOR"
                ? formatStanding(standing)
                : profileParticulars.documentStatus}
            </small>
          </div>

          <nav className={styles.railNavigation}>
            {sourceAuthorityArticles.map(
              ([numeral, label, id]) => (
                <a
                  key={id}
                  href={`#${id}`}
                >
                  <span>{numeral}</span>
                  <small>{label}</small>
                </a>
              ),
            )}
          </nav>

          <a
            className={styles.railBackToTop}
            href="#source-authority-top"
          >
            ↑ Back to top
          </a>
        </aside>

        <div className={styles.folio}>
          <header className={styles.folioOpening}>
          <div>
            <span>Source Authority Instrument</span>
            <strong>
              {identity.instrumentReference}
            </strong>
          </div>

          <p>
            Institutional Source Profile
          </p>
        </header>

        <section
          className={styles.instrumentPreamble}
          aria-label="Purpose of this Source Authority Instrument"
        >
          <div className={styles.preambleNotation}>
            <span>Institutional Preamble</span>
            <small>Purpose of this Instrument</small>
          </div>

          <div className={styles.preambleMatter}>
            <h2>
              Governed institutional profile of{" "}
              {subject.displayName}
            </h2>

            {bafoulaSourceAuthorityNarrative.purpose.map(
              (paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ),
            )}
          </div>
        </section>

        <ProfileArticle
          id="institutional-identity"
          mode="declarative"
          numeral="I"
          articleLabel="Article I · Source Identity"
          title="Source Identity"
          assertion={institutionalIdentity}
        >
          <dl className={styles.identitySchedule}>
            <div className={styles.identityPrimary}>
              <dt>Institution</dt>
              <dd>{subject.displayName}</dd>
            </div>

            <div>
              <dt>Institutional Capacity</dt>
              <dd>{subject.institutionalCapacity}</dd>
            </div>

            <div>
              <dt>Operating Base</dt>
              <dd>{subject.operatingBase}</dd>
            </div>

            <div>
              <dt>Registered Address</dt>
              <dd>
                {profileParticulars.registeredAddress ??
                  "Not recorded"}
              </dd>
            </div>

            <div className={styles.identityRepresentative}>
              <dt>Authorized Cooperative Representative</dt>
              <dd>
                {cooperativeRepresentative ||
                  "Not recorded"}
              </dd>
            </div>

            {projection.audience === "OPERATOR" ? (
              <div>
                <dt>Source Contact · Operator Record</dt>
                <dd>
                  {profileParticulars.officialContact ??
                    "Not recorded"}
                </dd>
              </div>
            ) : null}

            <div>
              <dt>Sector</dt>
              <dd>{subject.sector}</dd>
            </div>

            <div className={styles.identityCommodity}>
              <dt>Commodity Activity</dt>
              <dd>
                {subject.principalCommodityActivity.join(
                  " · ",
                )}
              </dd>
            </div>
          </dl>
        </ProfileArticle>

        <ProfileArticle
          id="historical-standing"
          mode="contextual"
          numeral="II"
          articleLabel="Article II · Continuity & Mineral Standing"
          title="Continuity & Mineral Standing"
          assertion={null}
        >
          <div className={styles.narrativeStack}>
            {bafoulaSourceAuthorityNarrative.historicalStanding.paragraphs.map(
              (paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ),
            )}
          </div>

          <p
            className={[
              styles.articleSignature,
              styles.continuitySignature,
            ].join(" ")}
          >
            Continuity of Source Relationships
            <span aria-hidden="true">·</span>
            Productive Practice
            <span aria-hidden="true">·</span>
            Commercial Memory
          </p>

          <div className={styles.continuum}>
            <header>
              <span>Sovereignty Continuum</span>
              <p>
                Mineral continuity · administrative change ·
                public sovereignty
              </p>
            </header>

            <ol className={styles.continuumTrack}>
              {bafoulaSourceAuthorityNarrative.historicalStanding.continuum.map(
                (entry) => (
                  <li key={entry.period}>
                    <div className={styles.continuumMarker}>
                      <span>{entry.period}</span>
                    </div>

                    <div>
                      <h3>{entry.title}</h3>
                      <p>{entry.note}</p>
                    </div>
                  </li>
                ),
              )}
            </ol>
          </div>
        </ProfileArticle>

        <ProfileArticle
          id="sovereign-regulatory-context"
          mode="declarative"
          numeral="III"
          articleLabel="Article III · Sovereign & Regulatory Context"
          title="Malian Sovereign & Regulatory Context"
          assertion={sovereignContext}
        >
          <div className={styles.authorityComparison}>
            <section>
              <span>Source-Side Authority</span>
              <h3>Coopérative de Bafoula</h3>
              <ul>
                {bafoulaSourceAuthorityNarrative.sovereignContext.sourceSide.map(
                  (item) => (
                    <li key={item}>{item}</li>
                  ),
                )}
              </ul>
            </section>

            <section>
              <span>State Authority</span>
              <h3>Republic of Mali · Competent Authorities</h3>
              <ul>
                {bafoulaSourceAuthorityNarrative.sovereignContext.stateSide.map(
                  (item) => (
                    <li key={item}>{item}</li>
                  ),
                )}
              </ul>
            </section>
          </div>
          {sourceAuthority ? (
            <div className={styles.narrativeStack}>
              <p>{sourceAuthority.statement}</p>

              {sourceAuthority.scope ? (
                <details className={styles.governanceNote}>
                  <summary>Source authority notation</summary>
                  <p>{sourceAuthority.scope}</p>
                </details>
              ) : null}
            </div>
          ) : null}
        </ProfileArticle>

        <ProfileArticle
          id="geographic-source-context"
          mode="contextual"
          numeral="IV"
          articleLabel="Article IV · Source Geography"
          title="Source Geography"
          assertion={null}
        >
          <div className={styles.geographySurface}>
            <section
              className={styles.sourceMapField}
              aria-label="Bafoula source geography"
            >
              <header className={styles.mapTerritoryLabel}>
                <span>Republic of Mali</span>
                <strong>Bamako</strong>
                <small>Governed Operating Base</small>
              </header>

              <img
                className={styles.sourceMapOutline}
                src="/instruments/source-authority/mali-outline.svg"
                alt=""
                aria-hidden="true"
              />

              <div className={styles.mapNarrative}>
                {bafoulaSourceAuthorityNarrative.geographicContext.map(
                  (paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ),
                )}
              </div>

              <dl className={styles.mapFacts}>
                <div>
                  <dt>Operating Base</dt>
                  <dd>{subject.operatingBase}</dd>
                </div>

                <div>
                  <dt>Jurisdiction</dt>
                  <dd>{subject.jurisdiction}</dd>
                </div>

                <div>
                  <dt>Principal Commodity</dt>
                  <dd>
                    {subject.principalCommodityActivity.join(
                      " · ",
                    )}
                  </dd>
                </div>
              </dl>
            </section>

            <section
              className={styles.sourceActivityRegion}
              aria-label="Source activity"
            >
              <header className={styles.sourceActivityHeader}>
                <span>Source Activity</span>
                <small>
                  Governed capability record
                </small>
              </header>

              {projection.audience === "OPERATOR" &&
              operationalCapability ? (
                <aside className={styles.governedInset}>
                  <header>
                    <span>
                      Governed Operating Scope ·{" "}
                      {operationalCapability.reference}
                    </span>
                    <small>
                      {recognitionState(
                        operationalCapability,
                      )}
                    </small>
                  </header>

                  <p>
                    {operationalCapability.statement}
                  </p>

                  <div
                    className={styles.governedInsetMeta}
                  >
                    <span>
                      Evidence ·{" "}
                      {
                        operationalCapability
                          .evidence.length
                      }
                    </span>
                  </div>

                  {operationalCapability.scope ? (
                    <details
                      className={
                        styles.governedInsetNote
                      }
                    >
                      <summary>
                        Governance notation
                      </summary>
                      <p>
                        {operationalCapability.scope}
                      </p>
                    </details>
                  ) : null}
                </aside>
              ) : null}

              <div
                className={
                  styles.sourceActivitySchedule
                }
              >
                {capabilities.map(
                  (capability, index) => (
                    <article
                      key={capability.capabilityKey}
                    >
                      <span>
                        {String(index + 1).padStart(
                          2,
                          "0",
                        )}
                      </span>

                      <div>
                        <h3>
                          {capability.title}
                        </h3>
                        <p>
                          {capability.description}
                        </p>
                      </div>
                    </article>
                  ),
                )}
              </div>
            </section>
          </div>
        </ProfileArticle>

        <ProfileArticle
          id="international-commercial-channel"
          mode="declarative"
          numeral="V"
          articleLabel="Article V · International Commercial Channel"
          title="French-Ward, Inc."
          assertion={
            projection.audience === "OPERATOR"
              ? commercialRelationship
              : null
          }
        >
          {projection.audience !== "OPERATOR" &&
          commercialRelationship ? (
            <p className={styles.channelStatement}>
              {
                bafoulaSourceAuthorityNarrative
                  .commercialMandate
                  .statement
              }
            </p>
          ) : null}

          <div className={styles.commercialOpenChannel}>


            <section
              className={styles.commercialEngagementField}
              aria-label="Commercial engagement"
            >
              <header>
                <span>Commercial Engagement</span>

                <p>
                  {
                    bafoulaSourceAuthorityNarrative
                      .commercialEngagement
                      .paragraphs[0]
                  }
                </p>
              </header>

              <div className={styles.commercialEngagementStages}>
                <article>
                  <span>01</span>
                  <strong>Qualify</strong>
                  <small>Qualified Counterparty</small>
                </article>

                <article>
                  <span>02</span>
                  <strong>Define</strong>
                  <small>Defined Commercial Opportunity</small>
                </article>

                <article>
                  <span>03</span>
                  <strong>Document</strong>
                  <small>Transaction-Specific Dossier</small>
                </article>

                <article>
                  <span>04</span>
                  <strong>Authorize</strong>
                  <small>Documentary / Regulatory Process</small>
                </article>

                <article>
                  <span>05</span>
                  <strong>Execute</strong>
                  <small>Logistics / Settlement Framework</small>
                </article>
              </div>

              <p className={styles.commercialEngagementBoundary}>
                Transaction-Specific
                <span aria-hidden="true">·</span>
                Document-Driven
                <span aria-hidden="true">·</span>
                Authority-Bounded
              </p>
            </section>

            <section
              className={styles.transactionStructuresOpen}
              aria-label="Transaction structures"
            >
              <header>
                <span>Transaction Structures</span>

                <small>
                  Applied only through transaction-specific authority
                </small>
              </header>

              <div>
                {bafoulaSourceAuthorityNarrative
                  .commercialEngagement
                  .structures.map(
                    (structure) => (
                      <span key={structure}>
                        {structure}
                      </span>
                    ),
                  )}
              </div>
            </section>
          </div>
        </ProfileArticle>

        <div className={styles.stewardshipBand}>
          <div className={styles.stewardshipBandLabel}>
            Institutional Stewardship
          </div>

        <ProfileArticle
          id="community-stewardship"
          mode="contextual"
          numeral="VI"
          articleLabel="Article VI · Community & Protection"
          title="Community & Protection"
          assertion={null}
        >
          <div
            className={styles.communityProtectionField}
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 1200 300"
              preserveAspectRatio="none"
            >
              <g className={styles.communitySupportSweep}>
                <path d="M70 244 C235 188 390 196 535 229 C686 264 824 266 1130 199" />
                <path d="M118 257 C278 218 415 220 552 246 C704 275 862 270 1084 220" />
              </g>

              <g className={styles.communityCollective}>
                <g transform="translate(242 170)">
                  <circle cx="0" cy="0" r="7" />
                  <path d="M-7 13 Q0 8 7 13 L10 46 Q0 51 -10 46 Z" />
                </g>

                <g transform="translate(286 148)">
                  <circle cx="0" cy="0" r="9" />
                  <path d="M-9 15 Q0 9 9 15 L12 58 Q0 64 -12 58 Z" />
                </g>

                <g transform="translate(333 162)">
                  <circle cx="0" cy="0" r="7" />
                  <path d="M-7 13 Q0 8 7 13 L9 48 Q0 52 -9 48 Z" />
                </g>

                <g transform="translate(381 136)">
                  <circle cx="0" cy="0" r="10" />
                  <path d="M-10 16 Q0 9 10 16 L14 64 Q0 71 -14 64 Z" />
                </g>

                <g transform="translate(432 155)">
                  <circle cx="0" cy="0" r="8" />
                  <path d="M-8 14 Q0 8 8 14 L11 52 Q0 57 -11 52 Z" />
                </g>

                <g transform="translate(482 142)">
                  <circle cx="0" cy="0" r="9" />
                  <path d="M-9 15 Q0 9 9 15 L12 59 Q0 65 -12 59 Z" />
                </g>

                <g transform="translate(535 164)">
                  <circle cx="0" cy="0" r="7" />
                  <path d="M-7 13 Q0 8 7 13 L9 47 Q0 52 -9 47 Z" />
                </g>

                <g transform="translate(589 139)">
                  <circle cx="0" cy="0" r="10" />
                  <path d="M-10 16 Q0 9 10 16 L14 63 Q0 70 -14 63 Z" />
                </g>

                <g transform="translate(646 155)">
                  <circle cx="0" cy="0" r="8" />
                  <path d="M-8 14 Q0 8 8 14 L11 52 Q0 57 -11 52 Z" />
                </g>

                <g transform="translate(700 145)">
                  <circle cx="0" cy="0" r="9" />
                  <path d="M-9 15 Q0 9 9 15 L12 58 Q0 64 -12 58 Z" />
                </g>

                <g transform="translate(754 168)">
                  <circle cx="0" cy="0" r="7" />
                  <path d="M-7 13 Q0 8 7 13 L9 46 Q0 51 -9 46 Z" />
                </g>

                <g transform="translate(805 151)">
                  <circle cx="0" cy="0" r="9" />
                  <path d="M-9 15 Q0 9 9 15 L12 55 Q0 61 -12 55 Z" />
                </g>
              </g>

              <g className={styles.communityProtectionArc}>
                <path d="M178 198 C275 92 414 66 596 72 C774 78 919 109 1026 195" />
                <path d="M215 208 C302 120 427 100 596 104 C754 108 879 132 988 207" />
              </g>

              <g className={styles.communityContinuityMarks}>
                <circle cx="208" cy="218" r="3" />
                <circle cx="229" cy="226" r="2" />
                <circle cx="970" cy="223" r="3" />
                <circle cx="991" cy="214" r="2" />
              </g>
            </svg>
          </div>

          <div className={styles.narrativeStack}>
            {bafoulaSourceAuthorityNarrative.stewardship.map(
              (paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ),
            )}
          </div>
        </ProfileArticle>

        <ProfileArticle
          id="operating-principles"
          mode="operational"
          numeral="VII"
          articleLabel="Article VII · Operating Doctrine"
          title="Operating Doctrine"
          assertion={null}
        >
          <p
            className={[
              styles.articleSignature,
              styles.doctrineSignature,
            ].join(" ")}
          >
            Source Governance
            <span aria-hidden="true">·</span>
            Documented Authority
            <span aria-hidden="true">·</span>
            Commercial Discipline
          </p>

          <div className={styles.principlesSchedule}>
            {bafoulaSourceAuthorityNarrative.operatingPrinciples.map(
              (principle) => (
                <article key={principle.number}>
                  <span>{principle.number}</span>

                  <div>
                    <h3>{principle.title}</h3>
                    <p>{principle.statement}</p>
                  </div>
                </article>
              ),
            )}
          </div>
        </ProfileArticle>
        </div>

        <ProfileArticle
          id="documentary-recognition-register"
          mode="diligence"
          numeral="VIII"
          articleLabel="Article VIII · Documentary Standing"
          title="Documentary Standing"
          assertion={null}
        >
          {projection.audience === "OPERATOR" ? (
            <>
              <p className={styles.registerSectionLabel}>
                Governed Presentation State
              </p>

              <dl className={styles.documentaryRegister}>
                <div>
                  <dt>Documentary Evidence</dt>
                  <dd>
                    {evidenceRegister.length === 0
                      ? "None admitted"
                      : `${evidenceRegister.length} admitted`}
                  </dd>
                </div>

                <div>
                  <dt>Operator Recognition</dt>
                  <dd>
                    {recognizedAssertions === 0
                      ? "Unreviewed"
                      : `${recognizedAssertions} assertions`}
                  </dd>
                </div>

                <div>
                  <dt>Presentation Standing</dt>
                  <dd>{formatStanding(standing)}</dd>
                </div>
              </dl>
            </>
          ) : null}


          <p className={styles.profileDocumentLabel}>
            Source Profile Record
          </p>

          <dl className={styles.profileDocumentSchedule}>
            <div>
              <dt>Profile Reference</dt>
              <dd>
                {profileParticulars.documentReference}
              </dd>
            </div>

            <div>
              <dt>Profile Version</dt>
              <dd>
                {profileParticulars.documentVersion}
              </dd>
            </div>

            <div>
              <dt>Profile Status</dt>
              <dd>
                {profileParticulars.documentStatus}
              </dd>
            </div>

            <div>
              <dt>Registration Standing</dt>
              <dd>
                {formatStanding(
                  profileParticulars.registrationStanding,
                )}
              </dd>
            </div>

            {projection.audience === "OPERATOR" ? (
              <div>
                <dt>Registration Reference</dt>
                <dd>
                  {profileParticulars.registrationReference ??
                    "Pending documentary completion"}
                </dd>
              </div>
            ) : null}
          </dl>

          {projection.audience === "OPERATOR" ? (
            <>
          <p className={styles.registerSectionLabel}>
            Admitted Documentary Evidence
          </p>

          {evidenceRegister.length > 0 ? (
            <div className={styles.evidenceRegister}>
              {evidenceRegister.map(
                (evidence) => (
                  <article
                    key={evidence.evidenceId}
                  >
                    <div>
                      <span>
                        {evidence.evidenceRole}
                      </span>

                      <h3>{evidence.label}</h3>
                    </div>

                    <dl>
                      <div>
                        <dt>Reference</dt>
                        <dd>
                          {evidence.reference ??
                            "Not recorded"}
                        </dd>
                      </div>

                      <div>
                        <dt>Admitted</dt>
                        <dd>
                          {evidence.admittedAt ??
                            "Not recorded"}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ),
              )}
            </div>
          ) : (
            <p className={styles.emptyRegister}>
              No documentary evidence is presently
              admitted to this presentation.
            </p>
          )}
            </>
          ) : null}
        </ProfileArticle>

        <section
          id="instrument-scope-boundary"
          className={[
            styles.scopeArticle,
            styles.articleDiligence,
          ].join(" ")}
        >
          <aside className={styles.articleMargin}>
            <span className={styles.articleNumeral}>
              IX
            </span>
            <small>BOUNDARY</small>
          </aside>

          <div className={styles.articleMatter}>
            <header className={styles.articleHeader}>
              <p>
                Article IX · Instrument Boundary
              </p>

              <h2>
                Instrument Boundary
              </h2>
            </header>

            <p className={styles.scopeStatement}>
              {projection.audience === "OPERATOR"
                ? boundary.statement
                : "This Source Authority presentation records institutional profile information, documentary references, source-side capabilities, and presentation standing. It does not itself establish sovereign State authority, regulatory approval, export authorization, commodity availability or allocation, title, transaction authority, or settlement authority."}
            </p>

            {projection.audience === "OPERATOR" ? (
              <div className={styles.boundarySchedule}>
                <span>Sovereign authority</span>
                <span>Regulatory approval</span>
                <span>Export authorization</span>
                <span>Commodity availability</span>
                <span>Commodity allocation</span>
                <span>Title</span>
                <span>Transaction authority</span>
                <span>Settlement authority</span>
              </div>
            ) : (
              <p className={styles.externalBoundaryNote}>
                Transaction-specific authority and regulatory
                permissions remain separately governed.
              </p>
            )}
          </div>
        </section>

        <footer className={styles.folioFooter}>
          <span>
            {identity.instrumentReference}
          </span>

          <span>
            Version {identity.versionNumber}
          </span>

          <span>
            {projection.audience} Presentation
          </span>

          <span>
            {formatStanding(standing)}
          </span>
        </footer>
        </div>
      </div>
    </article>
  );
}
