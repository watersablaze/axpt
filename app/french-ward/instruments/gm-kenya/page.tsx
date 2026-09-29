import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import styles from "./page.module.css";
import { prisma } from "@/infrastructure/db/prisma";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin as hasAdminAccess } from "@/domains/auth/isAdmin";
import {
  institutionalInstrumentAccessCookieName,
} from "@/domains/instruments/access/accessToken";
import {
  loadInstrumentDeliberationWithClient,
} from "@/domains/instruments/queries/loadInstrumentDeliberationWithClient";
import {
  resolveInstitutionalInstrumentAccessWithClient,
} from "@/domains/instruments/queries/resolveInstitutionalInstrumentAccessWithClient";
import {
  globalMotherV2Definition,
} from "@/domains/instruments/definitions/globalMotherV2Definition";
import { InstrumentShell } from "@/components/instruments/InstrumentShell";
import { RoyalRelationshipMap } from "@/components/french-ward/gm/RoyalRelationshipMap";
import { RelationshipUnderstanding } from "@/components/french-ward/gm/RelationshipUnderstanding";
import { GlobalMotherRelationshipFieldV2 } from "@/components/french-ward/gm/GlobalMotherRelationshipFieldV2";
import { AuthorityArchitecture } from "@/components/french-ward/gm/AuthorityArchitecture";
import { GlobalMotherAuthorityFieldV2 } from "@/components/french-ward/gm/GlobalMotherAuthorityFieldV2";
import { EconomicCorridor } from "@/components/french-ward/gm/EconomicCorridor";
import { GlobalMotherPassageFieldV2 } from "@/components/french-ward/gm/GlobalMotherPassageFieldV2";
import { FutureBody } from "@/components/french-ward/gm/FutureBody";
import { GlobalMotherContinuityFieldV2 } from "@/components/french-ward/gm/GlobalMotherContinuityFieldV2";
import { DeliberationField } from "@/components/french-ward/gm/DeliberationField";
import { GlobalMotherDeliberationFrameV2 } from "@/components/french-ward/gm/GlobalMotherDeliberationFrameV2";
import { GlobalMotherExperience } from "@/components/french-ward/gm/GlobalMotherExperience";
import { GlobalMotherConstitutionalShell } from "@/components/french-ward/gm/GlobalMotherConstitutionalShell";

const v1Movements = [
  { index: "01", label: "Relationship", active: true },
  { index: "02", label: "Architecture" },
  { index: "03", label: "Economic Corridor" },
  { index: "04", label: "Future Body" },
  { index: "05", label: "Deliberation" },
];

const v2Movements = [
  {
    index: "I",
    label: "Recognition & Relationship",
    active: true,
  },
  {
    index: "II",
    label: "Authority & Custodianship",
  },
  {
    index: "III",
    label: "Passage & Economic Cooperation",
  },
  {
    index: "IV",
    label: "Restoration & Continuity",
  },
  {
    index: "V",
    label: "Deliberation & Instrument Formation",
  },
];

const GM_REFERENCE =
  "GM-KENYA-RCF-001";

type GreatMotherInstrumentPageProps = Readonly<{
  searchParams?: Promise<{
    previewVersion?: string | string[];
  }>;
}>;

export default async function GreatMotherInstrumentPage({
  searchParams,
}: GreatMotherInstrumentPageProps) {
  const [cookieStore, principal, resolvedSearchParams] =
    await Promise.all([
      cookies(),
      getPrincipal(),
      searchParams ?? Promise.resolve({}),
    ]);

  const internalInspectionAllowed =
    principal !== null &&
    hasAdminAccess(principal);

  const previewVersionParam =
    Array.isArray(
      resolvedSearchParams.previewVersion,
    )
      ? resolvedSearchParams.previewVersion[0]
      : resolvedSearchParams.previewVersion;

  /*
   * Draft projection is explicit and admin-only.
   *
   * An ordinary participant cannot move their
   * presentation away from currentVersion merely
   * by appending a query parameter.
   */
  const requestedPreviewVersion =
    internalInspectionAllowed &&
    previewVersionParam === "2"
      ? 2
      : null;

  const internalV2Preview =
    requestedPreviewVersion === 2;

  const accessToken =
    cookieStore.get(
      institutionalInstrumentAccessCookieName(
        GM_REFERENCE,
      ),
    )?.value ?? null;

  /*
   * The destination page does not record another
   * access event. Token exchange already performed
   * the attributable access-recording act.
   *
   * Here we only resolve the current cookie into
   * presentation / deliberation identity context.
   */
  const access =
    accessToken
      ? await resolveInstitutionalInstrumentAccessWithClient({
          client:
            prisma,
          instrumentReference:
            GM_REFERENCE,
          token:
            accessToken,
          recordAccess:
            false,
        })
      : null;

  const recipientAccess = access && principal?.userId === access.grant.recipientUserId
    ? access : null;

  if (
    (!recipientAccess && !internalInspectionAllowed) ||
    (recipientAccess !== null && recipientAccess.instrument.currentVersion >= 2 &&
      !recipientAccess.grant.instrumentVersionId && !internalInspectionAllowed)
  ) {
    notFound();
  }

  const deliberationActorUserId =
    internalV2Preview
      ? null
      : recipientAccess?.grant.recipientUserId ??
        null;

  const deliberation =
    await loadInstrumentDeliberationWithClient({
      client:
        prisma,
      instrumentReference:
        GM_REFERENCE,
      actorUserId:
        deliberationActorUserId,
      versionNumber:
        requestedPreviewVersion,
    });

  if (!deliberation) {
    notFound();
  }

  const deliberationProjection = {
    propositions:
      deliberation.propositions.map(
        (proposition) => ({
          id:
            proposition.id,
          reference:
            proposition.reference,
          state:
            proposition.state,
          domain:
            proposition.domain,
          title:
            proposition.title,
          body:
            proposition.body,
          ordinal:
            proposition.ordinal,
          resolution:
            proposition.resolution,
          response:
            proposition.response
              ? {
                  id:
                    proposition.response.id,
                  responseType:
                    proposition.response
                      .responseType,
                  note:
                    proposition.response
                      .note,
                  createdAt:
                    proposition.response
                      .createdAt
                      .toISOString(),
                }
              : null,
        }),
      ),
    summary:
      deliberation.summary,
  };

  const participantV2 =
    !internalV2Preview &&
    recipientAccess !== null &&
    deliberation.version.number === 2 &&
    deliberation.version.status === "ISSUED" &&
    recipientAccess.grant.instrumentVersionId === deliberation.version.id;

  const v2Presentation = internalV2Preview || participantV2;

  const FrameworkShell =
    v2Presentation
      ? GlobalMotherConstitutionalShell
      : InstrumentShell;

  const frameworkMovements =
    v2Presentation
      ? v2Movements
      : v1Movements;

  return (
    <GlobalMotherExperience
      enabled={v2Presentation}
      recipient={participantV2 && access ? {
        name: access.grant.recipientName ?? "Institutional participant",
        institution: access.grant.representedInstitution ?? "",
        capacity: access.grant.representativeCapacity ?? "",
      } : null}
    >
      <FrameworkShell
      eyebrow={
        internalV2Preview
          ? "French-Ward / Internal Instrument Preview"
          : "French-Ward / Controlled Instrument"
      }
      title={
        v2Presentation
          ? globalMotherV2Definition.title
          : "Framework of Royal Custodianship"
      }
      subtitle={
        v2Presentation
          ? globalMotherV2Definition.subtitle
          : "Ancestral Restoration & Global Economic Cooperation"
      }
      reference="GM-KENYA-RCF-001"
      version={
        v2Presentation
          ? `V${deliberation.version.number}`
          : `V${deliberation.version.number}`
      }
      status={
        internalV2Preview
          ? "DRAFT · INTERNAL PREVIEW · NOT ISSUED"
          : participantV2
            ? "ISSUED · RESPONSE OPEN"
            : "UNDER DELIBERATION"
      }
      movements={frameworkMovements}
      recipient={participantV2 && access ? {
        name: access.grant.recipientName ?? "Institutional participant",
        institution: access.grant.representedInstitution ?? "",
        capacity: access.grant.representativeCapacity ?? "",
      } : null}
    >
      <section
        id="gm-movement-I"
        className={
          v2Presentation
            ? `${styles.movement} ${styles.baseArticle} ${styles.articleRelationship}`
            : styles.movement
        }
        aria-labelledby="relationship-heading"
      >
        <header className={styles.movementHeader}>
          <span className={styles.movementNumber}>
          {v2Presentation ? "I" : "01"}
        </span>
          <div>
            <p className={styles.movementKicker}>
              {v2Presentation
                ? "Recognition & Relationship"
                : "The Relationship"}
            </p>
            <h2 id="relationship-heading">
              {v2Presentation
                ? "A trusted relationship takes form."
                : "Relationship before transaction."}
            </h2>
            <p className={styles.movementLead}>
              {v2Presentation
                ? "The Global Mother’s trust in Imperial Khan-Khan opens a bridge among ND Royal Ministry, AOTG, and French-Ward. Gold anchors the present work."
                : "The initiating proposition is understood as a Royal and custodial relationship through which trade, restoration, projects and continuing return may be responsibly developed."}
            </p>
          </div>
        </header>

        {v2Presentation ? (
          <div className={styles.relationshipField}>
            <GlobalMotherRelationshipFieldV2 />
          </div>
        ) : (
          <>
            <div className={styles.relationshipField}>
              <RoyalRelationshipMap />
            </div>

            <RelationshipUnderstanding />
          </>
        )}
      </section>

      <section
        id="gm-movement-II"
        className={
          v2Presentation
            ? `${styles.movement} ${styles.baseArticle} ${styles.articleAuthority}`
            : styles.movement
        }
        aria-labelledby="architecture-heading"
      >
        {v2Presentation ? (
          <>
            <header className={styles.articleMasthead}>
              <div className={styles.articleTopline}>
                <span className={styles.articleOrdinal}>
                  II
                </span>

                <span className={styles.articleReference}>
                  {deliberation.instrumentReference}
                </span>
              </div>

              <div className={styles.articleIdentity}>
                <div>
                  <p className={styles.articleLabel}>
                    Authority &amp; Custodianship
                  </p>

                  <h2 id="architecture-heading">
                    Authority has a source and a scope.
                  </h2>
                </div>

                <p className={styles.articleSummary}>
                  ND Royal Ministry retains Royal authority.
                  AOTG and French-Ward carry distinct roles;
                  French-Ward’s gold authority follows its
                  operative mandate.
                </p>
              </div>
            </header>

            <div
              className={`${styles.architectureField} ${styles.articleBody}`}
            >
              <GlobalMotherAuthorityFieldV2 />
            </div>
          </>
        ) : (
          <>
            <header className={styles.movementHeader}>
              <span className={styles.movementNumber}>
                02
              </span>

              <div>
                <p className={styles.movementKicker}>
                  The Architecture
                </p>

                <h2 id="architecture-heading">
                  Authority must have a perimeter.
                </h2>

                <p className={styles.movementLead}>
                  Custodianship is not transferred sovereignty.
                  The relationship becomes executable only when
                  retained, shared, delegated and prohibited
                  authority are made explicit.
                </p>
              </div>
            </header>

            <div className={styles.architectureField}>
              <AuthorityArchitecture />
            </div>
          </>
        )}
      </section>

      <section
        id="gm-movement-III"
        className={
          v2Presentation
            ? `${styles.movement} ${styles.baseArticle} ${styles.articlePassage}`
            : styles.movement
        }
        aria-labelledby="corridor-heading"
      >
        <header className={styles.movementHeader}>
          <span className={styles.movementNumber}>
            {v2Presentation ? "III" : "03"}
          </span>

          <div>
            <p className={styles.movementKicker}>
              {v2Presentation
                ? "Passage & Economic Cooperation"
                : "The Economic Corridor"}
            </p>

            <h2 id="corridor-heading">
              {v2Presentation
                ? "Gold moves through governed passage."
                : "Existence is not passage."}
            </h2>

            <p className={styles.movementLead}>
              {v2Presentation
                ? "Each stage requires its own authority, evidence, and capacity before the gold advances."
                : "Gold becomes commercially meaningful only when source authority, evidence, logistics, receiving capacity, assay and settlement are assembled into a governed path."}
            </p>
          </div>
        </header>

        <div className={styles.corridorField}>
          {v2Presentation ? (
            <GlobalMotherPassageFieldV2 />
          ) : (
            <EconomicCorridor />
          )}
        </div>
      </section>

      <section
        id="gm-movement-IV"
        className={
          v2Presentation
            ? `${styles.movement} ${styles.baseArticle} ${styles.articleContinuity}`
            : styles.movement
        }
        aria-labelledby="future-heading"
      >
        <header className={styles.movementHeader}>
          <span className={styles.movementNumber}>
            {v2Presentation ? "IV" : "04"}
          </span>

          <div>
            <p className={styles.movementKicker}>
              {v2Presentation
                ? "Restoration & Continuity"
                : "The Future Body"}
            </p>

            <h2 id="future-heading">
              {v2Presentation
                ? "What endures beyond the transaction."
                : "The relationship should leave something behind."}
            </h2>

            <p className={styles.movementLead}>
              {v2Presentation
                ? "Agreed return can support restoration and governmental capacity. French-Ward’s two-part Gift extends the relationship through Axis Point."
                : "Projects, digital infrastructure, cultural memory and continuing family relationship are treated as the productive body that should remain after individual transactions are complete."}
            </p>
          </div>
        </header>

        <div className={styles.futureField}>
          {v2Presentation ? (
            <GlobalMotherContinuityFieldV2 />
          ) : (
            <FutureBody />
          )}
        </div>
      </section>

      <section
        id="gm-movement-V"
        className={
          v2Presentation
            ? `${styles.movement} ${styles.baseArticle} ${styles.articleDeliberation} ${styles.deliberationArticle}`
            : styles.movement
        }
        aria-labelledby="deliberation-heading"
      >
        <header className={styles.movementHeader}>
          <span className={styles.movementNumber}>
            {v2Presentation ? "V" : "05"}
          </span>

          <div>
            <p className={styles.movementKicker}>
              {v2Presentation
                ? "Deliberation & Instrument Formation"
                : "Deliberation"}
            </p>

            <h2 id="deliberation-heading">
              Understanding must become attributable response.
            </h2>

            <p className={styles.movementLead}>
              {v2Presentation
                ? "Attributable responses may open drafting of a proposed master agreement. Authority and execution remain separate."
                : "Confirmed matters, shared understandings, proposals and open questions are distinguished so that alignment may emerge through visible institutional response rather than assumption."}
            </p>
          </div>
        </header>

        <div className={styles.deliberationField}>
          <GlobalMotherDeliberationFrameV2
            enabled={v2Presentation}
            instrumentReference={
              deliberation.instrument.reference
            }
            actorBound={
              participantV2 &&
              deliberation.actorUserId !== null
            }
          >
            <DeliberationField
              instrumentReference={
                deliberation.instrument.reference
              }
              instrumentStatus={
                deliberation.instrument.status
              }
              actorBound={
                participantV2 &&
                deliberation.actorUserId !== null
              }
              propositions={
                deliberationProjection.propositions
              }
              summary={
                deliberationProjection.summary
              }
            />
          </GlobalMotherDeliberationFrameV2>
        </div>
      </section>
      </FrameworkShell>
    </GlobalMotherExperience>
  );
}
