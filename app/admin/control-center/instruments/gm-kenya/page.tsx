import { notFound } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { globalMotherV4Definition } from "@/domains/instruments/definitions/globalMotherV4Definition";
import styles from "./page.module.css";
import { IssueV4Control } from "./IssueV4Control";
import { GrantV2Control } from "./GrantV2Control";
import { RevokeV2Control } from "./RevokeV2Control";
import { ChamberFollowUpControl } from "./ChamberFollowUpControl";
import { ChamberReminderControl } from "./ChamberReminderControl";
import { globalMotherDraftingGate } from "@/domains/instruments/invariants/globalMotherDraftingGate";
import { DraftingDecisionControl } from "./DraftingDecisionControl";
import { ResponseWorkspace } from "./ResponseWorkspace";

export const dynamic = "force-dynamic";

type SavedPosition = {
  reference?: unknown;
  responseType?: unknown;
  note?: unknown;
  responseId?: unknown;
};

function positionsFrom(value: unknown): SavedPosition[] {
  return Array.isArray(value)
    ? (value.filter(
        (item) =>
          item !== null && typeof item === "object" && !Array.isArray(item),
      ) as SavedPosition[])
    : [];
}

export default async function GlobalMotherResponseReviewPage() {
  const principal = await getPrincipal();
  if (!isAdmin(principal)) notFound();

  const instrument = await prisma.institutionalInstrument.findUnique({
    where: { reference: globalMotherV4Definition.reference },
    select: {
      id: true,
      reference: true,
      status: true,
      currentVersion: true,
      versions: {
        orderBy: { number: "desc" },
        select: {
          id: true,
          number: true,
          status: true,
          issuedAt: true,
          propositions: {
            orderBy: { ordinal: "asc" },
            select: { reference: true, title: true, body: true },
          },
        },
      },
      accessGrants: {
        orderBy: { issuedAt: "desc" },
        select: {
          id: true,
          recipientName: true,
          recipientUserId: true,
          recipientRole: true,
          accessLevel: true,
          instrumentVersionId: true,
          representedInstitution: true,
          representativeCapacity: true,
          issuedAt: true,
          expiresAt: true,
          revokedAt: true,
          firstAccessAt: true,
          lastAccessAt: true,
          recipientChallenge: {
            select: {
              sentAt: true,
              attemptCount: true,
              sendCount: true,
              consumedAt: true,
            },
          },
        },
      },
      draftingDecisions: {
        orderBy: { recordedAt: "desc" },
        select: {
          id: true,
          versionId: true,
          standing: true,
          rationale: true,
          reviewedReceiptIds: true,
          recordedAt: true,
          actor: { select: { email: true, displayName: true, name: true } },
        },
      },
      responseSets: {
        orderBy: { recordedAt: "desc" },
        select: {
          id: true,
          versionId: true,
          grantId: true,
          actorUserId: true,
          representedInstitution: true,
          representativeCapacity: true,
          positions: true,
          recordedAt: true,
          actor: { select: { email: true, displayName: true, name: true } },
        },
      },
    },
  });
  if (!instrument) notFound();
  const version = instrument.versions.find(
    (item) => item.number === globalMotherV4Definition.version,
  );
  const historicalReceipts = instrument.responseSets.filter(
    (set) => set.versionId !== version?.id,
  );
  const currentGrants = instrument.accessGrants.filter(
    (grant) => grant.instrumentVersionId === version?.id,
  );
  const receipts = instrument.responseSets.filter(
    (set) => set.versionId === version?.id,
  );
  const draftingDecisions = instrument.draftingDecisions.filter(
    (decision) => decision.versionId === version?.id,
  );
  const invitationLogs = currentGrants.length
    ? await prisma.emailLog.findMany({
        where: {
          OR: currentGrants.map((grant) => ({
            type: {
              startsWith: `GM_CHAMBER_INVITATION_${grant.id}_`,
            },
          })),
          status: "SENT",
        },
        select: {
          type: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    : [];

  const invitationSentAt = new Map<string, Date>();
  for (const log of invitationLogs) {
    const grant = currentGrants.find((item) =>
      log.type?.startsWith(`GM_CHAMBER_INVITATION_${item.id}_`),
    );
    if (grant && !invitationSentAt.has(grant.id)) {
      invitationSentAt.set(grant.id, log.createdAt);
    }
  }

  const draftingGate = globalMotherDraftingGate(receipts);

  const activeCurrentGrants = currentGrants.filter((grant) => {
    const expired = Boolean(grant.expiresAt && grant.expiresAt < new Date());

    return !grant.revokedAt && !expired;
  });

  const respondedGrantIds = new Set(
    receipts
      .map((set) => set.grantId)
      .filter((grantId): grantId is string => Boolean(grantId)),
  );

  const respondedCount = activeCurrentGrants.filter((grant) =>
    respondedGrantIds.has(grant.id),
  ).length;

  const awaitingCount = Math.max(
    activeCurrentGrants.length - respondedCount,
    0,
  );

  const responsePositions = receipts.flatMap((set) =>
    positionsFrom(set.positions),
  );

  const responseStanding = responsePositions.reduce(
    (standing, position) => {
      const type =
        typeof position.responseType === "string" ? position.responseType : "";

      if (type === "AFFIRM") standing.affirm += 1;
      else if (type === "REVISE") standing.revise += 1;
      else if (type === "DECLINE") standing.decline += 1;
      else if (type === "CLARIFY") standing.clarify += 1;

      return standing;
    },
    {
      affirm: 0,
      revise: 0,
      decline: 0,
      clarify: 0,
    },
  );

  const collectionComplete =
    activeCurrentGrants.length > 0 &&
    respondedCount === activeCurrentGrants.length;

  const open = receipts.reduce(
    (count, set) =>
      count +
      positionsFrom(set.positions).filter(
        (position) => position.responseType !== "AFFIRM",
      ).length,
    0,
  );

  const responseIndexEntries = currentGrants.map((grant) => {
    const response = receipts.find((set) => set.grantId === grant.id) ?? null;

    const expired = Boolean(grant.expiresAt && grant.expiresAt < new Date());

    const lifecycle = grant.revokedAt
      ? "REVOKED"
      : expired
        ? "EXPIRED"
        : response
          ? "RESPONDED"
          : grant.lastAccessAt
            ? "CHAMBER ENTERED"
            : grant.recipientChallenge
              ? "VERIFICATION INITIATED"
              : "ISSUED";

    return {
      grantId: grant.id,
      recipientName:
        grant.recipientName ?? grant.recipientUserId ?? "Unnamed recipient",
      representedInstitution:
        grant.representedInstitution ?? "Institution missing",
      representativeCapacity:
        grant.representativeCapacity ?? "Capacity missing",
      lifecycle,
      response: response
        ? {
            id: response.id,
            recordedAt: response.recordedAt.toISOString(),
            representedInstitution: response.representedInstitution,
            representativeCapacity: response.representativeCapacity,
            actor:
              response.actor.displayName ??
              response.actor.name ??
              response.actor.email,
            positions: positionsFrom(response.positions).map((position) => ({
              reference:
                typeof position.reference === "string"
                  ? position.reference
                  : "",
              responseType:
                typeof position.responseType === "string"
                  ? position.responseType
                  : "",
              note:
                typeof position.note === "string" && position.note
                  ? position.note
                  : null,
            })),
          }
        : null,
    };
  });

  return (
    <main className={styles.page}>
      <div className={styles.workspace}>
        <header className={styles.instrumentBar}>
          <div className={styles.instrumentIdentity}>
            <span>Global Mother</span>
            <strong>{instrument.reference}</strong>
          </div>

          <div className={styles.instrumentState}>
            <span>UNDER DELIBERATION</span>
            <b>
              V{globalMotherV4Definition.version} ·{" "}
              {version?.status ?? "ABSENT"}
            </b>
            <b>
              {respondedCount} / {activeCurrentGrants.length} RESPONSE SETS
            </b>
            <b>{awaitingCount} OUTSTANDING</b>
            <b>FORMATION HOLD</b>
          </div>
        </header>

        <aside className={styles.contextRail}>
          <section
            className={styles.metrics}
            aria-label="Framework response standing"
          >
            <div>
              <span>Instrument</span>
              <strong>{instrument.reference}</strong>
              <small>
                {instrument.status} · current V{instrument.currentVersion}
              </small>
            </div>
            <div>
              <span>Framework version</span>
              <strong>
                V{globalMotherV4Definition.version} ·{" "}
                {version?.status ?? "ABSENT"}
              </strong>
              <small>
                {version?.issuedAt?.toLocaleString() ?? "Not issued"}
              </small>
            </div>
            <div>
              <span>Bound grants</span>
              <strong>{currentGrants.length}</strong>
              <small>
                {currentGrants.filter((grant) => grant.firstAccessAt).length}{" "}
                accessed
              </small>
            </div>
            <div>
              <span>Response sets</span>
              <strong>{receipts.length}</strong>
              <small>{open} positions for discussion</small>
            </div>
          </section>

          <nav
            className={styles.operatorRail}
            aria-label="Global Mother operator workspace"
          >
            <a href="#gm-overview">
              <span>Overview</span>
              <strong>{instrument.status}</strong>
            </a>
            <a href="#gm-create-recipient">
              <span>Create Recipient</span>
              <strong>ISSUE</strong>
            </a>
            <a href="#gm-recipient-registry">
              <span>Recipient Registry</span>
              <strong>{currentGrants.length}</strong>
            </a>
            <a href="#gm-responses">
              <span>Responses</span>
              <strong>{receipts.length}</strong>
            </a>
            <a href="#gm-drafting">
              <span>Agreement / Formation</span>
              <strong>
                {collectionComplete ? "REVIEW" : `HOLD · ${awaitingCount}`}
              </strong>
            </a>
            <a href="#gm-history">
              <span>History / Events</span>
              <strong>{historicalReceipts.length}</strong>
            </a>
          </nav>
        </aside>

        <div className={styles.workGrid}>
          <div className={styles.accessColumn}>
            <section
              id="gm-overview"
              className={`${styles.section} ${styles.integritySection}`}
            >
              <div className={styles.integrityIdentity}>
                <span>System integrity</span>
                <h2>Framework source</h2>
              </div>

              <p>
                {version?.propositions.length ===
                  globalMotherV4Definition.propositions.length &&
                version.propositions.every(
                  (item, index) =>
                    item.reference ===
                      globalMotherV4Definition.propositions[index]?.reference &&
                    item.body ===
                      globalMotherV4Definition.propositions[index]?.body,
                )
                  ? version.status === "ISSUED"
                    ? "V4 SOURCE MATCH · 8 / 8"
                    : "V4 DRAFT MATCH · 8 / 8"
                  : "SOURCE MISMATCH · REVIEW REQUIRED"}
              </p>
              {version?.status === "DRAFT" &&
              instrument.currentVersion ===
                globalMotherV4Definition.version - 1 &&
              version.propositions.length ===
                globalMotherV4Definition.propositions.length &&
              version.propositions.every(
                (item, index) =>
                  item.reference ===
                    globalMotherV4Definition.propositions[index]?.reference &&
                  item.body ===
                    globalMotherV4Definition.propositions[index]?.body,
              ) ? (
                <IssueV4Control versionId={version.id} />
              ) : null}
            </section>

            <section
              id="gm-create-recipient"
              className={`${styles.section} ${styles.createRecipientSection}`}
            >
              <div className={styles.sectionHeading}>
                <div>
                  <span>01 / Access issuance</span>
                  <h2>Create Recipient</h2>
                </div>
                <small>NEW ACCESS GRANT</small>
              </div>

              <p className={styles.sectionLead}>
                Issue a version-bound Chamber credential. Creation is separate
                from inspection of existing recipient records.
              </p>

              {version?.status === "ISSUED" &&
              instrument.currentVersion === globalMotherV4Definition.version ? (
                <GrantV2Control versionId={version.id} />
              ) : null}
            </section>

            <section
              id="gm-recipient-registry"
              className={`${styles.section} ${styles.registrySection}`}
            >
              <div className={styles.sectionHeading}>
                <div>
                  <span>02 / Access ledger</span>
                  <h2>Recipient Registry</h2>
                </div>
                <small>
                  {currentGrants.length} RECORD
                  {currentGrants.length === 1 ? "" : "S"}
                </small>
              </div>

              {currentGrants.length === 0 ? (
                <p>No version-bound recipient grants.</p>
              ) : (
                <>
                  <div className={styles.registryColumns} aria-hidden="true">
                    <span>Recipient / Capacity</span>
                    <span>Access State</span>
                    <span>Record</span>
                  </div>

                  <div className={styles.recipientList}>
                    {currentGrants.map((grant) => {
                      const response = receipts.find(
                        (set) => set.grantId === grant.id,
                      );
                      const expired = Boolean(
                        grant.expiresAt && grant.expiresAt < new Date(),
                      );
                      const lifecycle = grant.revokedAt
                        ? "REVOKED"
                        : expired
                          ? "EXPIRED"
                          : response
                            ? "RESPONDED"
                            : grant.lastAccessAt
                              ? "CHAMBER ENTERED"
                              : grant.recipientChallenge
                                ? "VERIFICATION INITIATED"
                                : "ISSUED";
                      const sentAt = invitationSentAt.get(grant.id) ?? null;
                      return (
                        <details
                          key={grant.id}
                          className={styles.recipientItem}
                        >
                          <summary className={styles.recipientIdentity}>
                            <div>
                              <strong>
                                {grant.recipientName ??
                                  grant.recipientUserId ??
                                  "Unnamed recipient"}
                              </strong>
                              <span>
                                {grant.representedInstitution ??
                                  "Institution missing"}{" "}
                                ·{" "}
                                {grant.representativeCapacity ??
                                  "Capacity missing"}
                              </span>
                            </div>
                            <span className={styles.lifecycle}>
                              {lifecycle}
                            </span>
                          </summary>

                          <div className={styles.recipientBody}>
                            <dl className={styles.recipientMeta}>
                              <div>
                                <dt>Issued</dt>
                                <dd>{grant.issuedAt.toLocaleString()}</dd>
                              </div>
                              <div>
                                <dt>Expires</dt>
                                <dd>
                                  {grant.expiresAt?.toLocaleString() ??
                                    "No expiry"}
                                </dd>
                              </div>
                              <div>
                                <dt>First chamber access</dt>
                                <dd>
                                  {grant.firstAccessAt?.toLocaleString() ?? "—"}
                                </dd>
                              </div>
                              <div>
                                <dt>Last chamber access</dt>
                                <dd>
                                  {grant.lastAccessAt?.toLocaleString() ?? "—"}
                                </dd>
                              </div>
                            </dl>

                            <div className={styles.recipientStanding}>
                              <span>
                                {grant.recipientRole} · {grant.accessLevel}
                              </span>
                              {response ? (
                                <small>
                                  Response recorded{" "}
                                  {response.recordedAt.toLocaleString()}
                                </small>
                              ) : grant.recipientChallenge ? (
                                <small>
                                  Verification requested{" "}
                                  {grant.recipientChallenge.sentAt.toLocaleString()}{" "}
                                  · {grant.recipientChallenge.sendCount} code
                                  request
                                  {grant.recipientChallenge.sendCount === 1
                                    ? ""
                                    : "s"}{" "}
                                  · {grant.recipientChallenge.attemptCount}{" "}
                                  failed attempt
                                  {grant.recipientChallenge.attemptCount === 1
                                    ? ""
                                    : "s"}
                                </small>
                              ) : (
                                <small>
                                  Verification has not been initiated.
                                </small>
                              )}
                            </div>

                            {!grant.revokedAt ? (
                              <>
                                {response &&
                                !expired &&
                                grant.recipientName?.includes("Khan-Khan") ? (
                                  <ChamberFollowUpControl grantId={grant.id} />
                                ) : null}

                                {!response &&
                                !expired &&
                                (grant.recipientName?.includes("Empress") ||
                                  grant.recipientName?.includes("Nama")) ? (
                                  <ChamberReminderControl grantId={grant.id} />
                                ) : null}

                                <RevokeV2Control
                                  grantId={grant.id}
                                  invitationSentAt={
                                    sentAt?.toISOString() ?? null
                                  }
                                />
                              </>
                            ) : null}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </>
              )}
            </section>
          </div>
          <div className={styles.reviewColumn}>
            <section
              id="gm-responses"
              className={`${styles.section} ${styles.responseDomain}`}
            >
              <div className={styles.sectionHeading}>
                <div>
                  <span>03 / Deliberation record</span>
                  <h2>Participant Responses</h2>
                </div>
                <small>
                  {respondedCount} / {activeCurrentGrants.length} RECEIVED
                </small>
              </div>

              <p className={styles.sectionLead}>
                Inspect attributable positions individually or open all
                submitted response sets for deliberative comparison.
              </p>

              <ResponseWorkspace
                entries={responseIndexEntries}
                standing={responseStanding}
              />
            </section>
            <details
              id="gm-history"
              className={`${styles.section} ${styles.sectionDisclosure}`}
            >
              <summary className={styles.sectionSummary}>
                <div>
                  <span>05 / History</span>
                  <h2>Prior-version response history</h2>
                </div>
                <strong>{historicalReceipts.length}</strong>
              </summary>
              <div className={styles.sectionBody}>
                <p>
                  Historical receipts remain attributable to their original
                  version. They do not count toward the current V4 formation
                  review.
                </p>
                {historicalReceipts.length === 0 ? (
                  <p>No prior-version responses recorded.</p>
                ) : (
                  <>
                    {historicalReceipts.map((set) => {
                      const originalVersion = instrument.versions.find(
                        (item) => item.id === set.versionId,
                      );
                      const positions = positionsFrom(set.positions);
                      return (
                        <article key={set.id} className={styles.receipt}>
                          <header>
                            <div>
                              <span>
                                {originalVersion
                                  ? `V${originalVersion.number}`
                                  : "Prior version"}{" "}
                                · Receipt {set.id}
                              </span>
                              <h3>{set.representedInstitution}</h3>
                              <p>
                                {set.actor.displayName ??
                                  set.actor.name ??
                                  set.actor.email}{" "}
                                · {set.representativeCapacity}
                              </p>
                            </div>
                            <time dateTime={set.recordedAt.toISOString()}>
                              {set.recordedAt.toLocaleString()}
                            </time>
                          </header>
                          <ol>
                            {positions.map((position, index) => (
                              <li key={String(position.reference ?? index)}>
                                <div>
                                  <span>
                                    {String(position.reference ?? "")}
                                  </span>
                                  <strong>
                                    {String(position.responseType ?? "")}
                                  </strong>
                                </div>
                                {typeof position.note === "string" &&
                                position.note ? (
                                  <p>{position.note}</p>
                                ) : null}
                              </li>
                            ))}
                          </ol>
                        </article>
                      );
                    })}
                  </>
                )}
              </div>
            </details>
            <details
              id="gm-drafting"
              className={`${styles.section} ${styles.sectionDisclosure} ${styles.draftingDomain} ${draftingGate.ok ? styles.draftingReady : styles.draftingDormant}`}
              open={draftingGate.ok}
            >
              <summary className={styles.sectionSummary}>
                <div>
                  <span>04 / Agreement & Formation</span>
                  <h2>Master Agreement formation</h2>
                </div>
                <strong>
                  {draftingGate.ok ? "READY FOR REVIEW" : "NOT ACTIVATED"}
                </strong>
              </summary>
              <div className={styles.sectionBody}>
                <p className={styles.draftingBoundary}>
                  This is a separate formation domain. Framework issuance does
                  not activate it. Recorded responses establish the review
                  basis; only a separate operator decision can open preparation
                  of a proposed Master Agreement.
                </p>
                {draftingDecisions.length ? (
                  draftingDecisions.map((decision) => (
                    <article className={styles.item} key={decision.id}>
                      <div>
                        <strong>
                          {decision.standing === "OPEN_DRAFTING"
                            ? "Proposed drafting opened"
                            : "Held for review"}
                        </strong>
                        <span>
                          {decision.actor.displayName ??
                            decision.actor.name ??
                            decision.actor.email}{" "}
                          · {decision.recordedAt.toLocaleString()}
                        </span>
                        <p>{decision.rationale}</p>
                        <small>
                          {Array.isArray(decision.reviewedReceiptIds)
                            ? decision.reviewedReceiptIds.length
                            : 0}{" "}
                          receipts reviewed
                        </small>
                      </div>
                    </article>
                  ))
                ) : (
                  <p>No drafting decision recorded.</p>
                )}
                {version?.status === "ISSUED" &&
                instrument.currentVersion ===
                  globalMotherV4Definition.version ? (
                  <DraftingDecisionControl
                    key={receipts.map((set) => set.id).join(":")}
                    versionId={version.id}
                    receiptIds={receipts.map((set) => set.id)}
                    gate={draftingGate}
                  />
                ) : null}
              </div>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}
