import { notFound } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { globalMotherV3Definition } from "@/domains/instruments/definitions/globalMotherV3Definition";
import styles from "./page.module.css";
import { IssueV2Control } from "./IssueV2Control";
import { GrantV2Control } from "./GrantV2Control";
import { RevokeV2Control } from "./RevokeV2Control";
import { globalMotherDraftingGate } from "@/domains/instruments/invariants/globalMotherDraftingGate";
import { DraftingDecisionControl } from "./DraftingDecisionControl";

export const dynamic = "force-dynamic";

type SavedPosition = {
  reference?: unknown;
  responseType?: unknown;
  note?: unknown;
  responseId?: unknown;
};

function positionsFrom(value: unknown): SavedPosition[] {
  return Array.isArray(value) ? value.filter(item =>
    item !== null && typeof item === "object" && !Array.isArray(item),
  ) as SavedPosition[] : [];
}

export default async function GlobalMotherResponseReviewPage() {
  const principal = await getPrincipal();
  if (!isAdmin(principal)) notFound();

  const instrument = await prisma.institutionalInstrument.findUnique({
    where: { reference: globalMotherV3Definition.reference },
    select: {
      id: true, reference: true, status: true, currentVersion: true,
      versions: { orderBy: { number: "desc" }, select: {
        id: true, number: true, status: true, issuedAt: true,
        propositions: { orderBy: { ordinal: "asc" }, select: { reference: true, title: true, body: true } },
      } },
      accessGrants: { orderBy: { issuedAt: "desc" }, select: {
        id: true, recipientName: true, recipientUserId: true,
        recipientRole: true, accessLevel: true, instrumentVersionId: true,
        representedInstitution: true, representativeCapacity: true,
        issuedAt: true, expiresAt: true, revokedAt: true,
        firstAccessAt: true, lastAccessAt: true,
        recipientChallenge: { select: {
          sentAt: true, attemptCount: true, sendCount: true, consumedAt: true,
        } },
      } },
      draftingDecisions: { orderBy: { recordedAt: "desc" }, select: {
        id: true, versionId: true, standing: true, rationale: true,
        reviewedReceiptIds: true, recordedAt: true,
        actor: { select: { email: true, displayName: true, name: true } },
      } },
      responseSets: { orderBy: { recordedAt: "desc" }, select: {
        id: true, versionId: true, grantId: true, actorUserId: true,
        representedInstitution: true, representativeCapacity: true,
        positions: true, recordedAt: true,
        actor: { select: { email: true, displayName: true, name: true } },
      } },
    },
  });
  if (!instrument) notFound();
  const version = instrument.versions.find(
    item => item.number === globalMotherV3Definition.version,
  );
  const historicalReceipts = instrument.responseSets.filter(
    set => set.versionId !== version?.id,
  );
  const currentGrants = instrument.accessGrants.filter(grant => grant.instrumentVersionId === version?.id);
  const receipts = instrument.responseSets.filter(set => set.versionId === version?.id);
  const draftingDecisions = instrument.draftingDecisions.filter(decision => decision.versionId === version?.id);
  const invitationLogs = currentGrants.length
    ? await prisma.emailLog.findMany({
        where: {
          OR: currentGrants.map(grant => ({
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
    const grant = currentGrants.find(item =>
      log.type?.startsWith(`GM_CHAMBER_INVITATION_${item.id}_`),
    );
    if (grant && !invitationSentAt.has(grant.id)) {
      invitationSentAt.set(grant.id, log.createdAt);
    }
  }

  const draftingGate = globalMotherDraftingGate(receipts);
  const open = receipts.reduce((count, set) => count + positionsFrom(set.positions)
    .filter(position => position.responseType !== "AFFIRM").length, 0);

  return (
    <main className={styles.page}>
      <div className={styles.workspace}>
      <header className={styles.header}>
        <span>AXPT / Instrument governance</span>
        <h1>Global Mother · Framework responses</h1>
        <p>Receipts establish attributable positions. AXPT reviews alignment before any Master Agreement drafting decision.</p>
      </header>

      <section className={styles.metrics} aria-label="Framework response standing">
        <div><span>Instrument</span><strong>{instrument.reference}</strong><small>{instrument.status} · current V{instrument.currentVersion}</small></div>
        <div><span>Framework version</span><strong>V{globalMotherV3Definition.version} · {version?.status ?? "ABSENT"}</strong><small>{version?.issuedAt?.toLocaleString() ?? "Not issued"}</small></div>
        <div><span>Bound grants</span><strong>{currentGrants.length}</strong><small>{currentGrants.filter(grant => grant.firstAccessAt).length} accessed</small></div>
        <div><span>Response sets</span><strong>{receipts.length}</strong><small>{open} positions for discussion</small></div>
      </section>

      <nav className={styles.operatorRail} aria-label="Global Mother operator sections">
        <a href="#gm-access"><span>Access</span><strong>{currentGrants.length}</strong></a>
        <a href="#gm-responses"><span>Responses</span><strong>{receipts.length}</strong></a>
        <a href="#gm-history"><span>History</span><strong>{historicalReceipts.length}</strong></a>
        <a href="#gm-drafting"><span>Drafting</span><strong>{draftingGate.ok ? "READY" : "HOLD"}</strong></a>
      </nav>

      <div className={styles.workGrid}>
        <div className={styles.accessColumn}>
      <section className={`${styles.section} ${styles.integritySection}`}>
        <h2>Version integrity</h2>
        <p>{version?.propositions.length === globalMotherV3Definition.propositions.length &&
          version.propositions.every((item, index) => item.reference === globalMotherV3Definition.propositions[index]?.reference &&
            item.body === globalMotherV3Definition.propositions[index]?.body)
          ? version.status === "ISSUED"
            ? "Eight issued positions match the Framework source."
            : "Eight draft positions match the Framework source. V3 remains unissued."
          : "The V3 proposition record does not match the eight-position source. Resolve before issuance or response."}</p>
        {version?.status === "DRAFT" && instrument.currentVersion === 2 &&
          version.propositions.length === globalMotherV3Definition.propositions.length &&
          version.propositions.every((item, index) =>
            item.reference === globalMotherV3Definition.propositions[index]?.reference &&
            item.body === globalMotherV3Definition.propositions[index]?.body)
          ? <IssueV2Control versionId={version.id} /> : null}
      </section>

      <section id="gm-access" className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><span>01 / Access</span><h2>Recipient access</h2></div>
          <small>{currentGrants.length} current grant{currentGrants.length === 1 ? "" : "s"}</small>
        </div>
        {version?.status === "ISSUED" && instrument.currentVersion === globalMotherV3Definition.version ? <GrantV2Control versionId={version.id} /> : null}
        {currentGrants.length === 0 ? <p>No version-bound recipient grants.</p> : (
          <div className={styles.recipientList}>
            {currentGrants.map(grant => {
              const response = receipts.find(set => set.grantId === grant.id);
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
              const sentAt = invitationSentAt.get(grant.id) ?? null;
              return <details key={grant.id} className={styles.recipientItem}>
                <summary className={styles.recipientIdentity}>
                  <div>
                    <strong>{grant.recipientName ?? grant.recipientUserId ?? "Unnamed recipient"}</strong>
                    <span>{grant.representedInstitution ?? "Institution missing"} · {grant.representativeCapacity ?? "Capacity missing"}</span>
                  </div>
                  <span className={styles.lifecycle}>{lifecycle}</span>
                </summary>

                <div className={styles.recipientBody}>
                <dl className={styles.recipientMeta}>
                  <div><dt>Issued</dt><dd>{grant.issuedAt.toLocaleString()}</dd></div>
                  <div><dt>Expires</dt><dd>{grant.expiresAt?.toLocaleString() ?? "No expiry"}</dd></div>
                  <div><dt>First chamber access</dt><dd>{grant.firstAccessAt?.toLocaleString() ?? "—"}</dd></div>
                  <div><dt>Last chamber access</dt><dd>{grant.lastAccessAt?.toLocaleString() ?? "—"}</dd></div>
                </dl>

                <div className={styles.recipientStanding}>
                  <span>{grant.recipientRole} · {grant.accessLevel}</span>
                  {response
                    ? <small>Response recorded {response.recordedAt.toLocaleString()}</small>
                    : grant.recipientChallenge
                      ? <small>Verification requested {grant.recipientChallenge.sentAt.toLocaleString()} · {grant.recipientChallenge.sendCount} code request{grant.recipientChallenge.sendCount === 1 ? "" : "s"} · {grant.recipientChallenge.attemptCount} failed attempt{grant.recipientChallenge.attemptCount === 1 ? "" : "s"}</small>
                      : <small>Verification has not been initiated.</small>}
                </div>

                {!grant.revokedAt ? <RevokeV2Control grantId={grant.id} invitationSentAt={sentAt?.toISOString() ?? null} /> : null}
                </div>
              </details>;
            })}
          </div>
        )}
      </section>

        </div>
        <div className={styles.reviewColumn}>
      <details id="gm-responses" className={`${styles.section} ${styles.sectionDisclosure}`} open={receipts.length > 0}>
        <summary className={styles.sectionSummary}>
          <div><span>02 / Responses</span><h2>Recorded response sets</h2></div>
          <strong>{receipts.length}</strong>
        </summary>
        <div className={styles.sectionBody}>
        {receipts.length === 0 ? <p>No V3 responses recorded.</p> : receipts.map(set => {
          const positions = positionsFrom(set.positions);
          return <article key={set.id} className={styles.receipt}>
            <header><div><span>Receipt {set.id}</span><h3>{set.representedInstitution}</h3>
              <p>{set.actor.displayName ?? set.actor.name ?? set.actor.email} · {set.representativeCapacity}</p></div>
              <time dateTime={set.recordedAt.toISOString()}>{set.recordedAt.toLocaleString()}</time></header>
            <ol>{positions.map((position, index) => <li key={String(position.reference ?? index)}>
              <div><span>{String(position.reference ?? "")}</span><strong>{String(position.responseType ?? "")}</strong></div>
              {typeof position.note === "string" && position.note ? <p>{position.note}</p> : null}
            </li>)}</ol>
            <p className={styles.boundary}>Review the record and authority evidence before deciding whether to open Master Agreement drafting.</p>
          </article>;
        })}
        </div>
      </details>
      <details id="gm-history" className={`${styles.section} ${styles.sectionDisclosure}`}>
        <summary className={styles.sectionSummary}>
          <div><span>03 / History</span><h2>Prior-version response history</h2></div>
          <strong>{historicalReceipts.length}</strong>
        </summary>
        <div className={styles.sectionBody}>
        <p>Historical receipts remain attributable to their original version. They do not count toward the V3 drafting threshold.</p>
        {historicalReceipts.length === 0 ? <p>No prior-version responses recorded.</p> : (
          <>
            {historicalReceipts.map(set => {
              const originalVersion = instrument.versions.find(item => item.id === set.versionId);
              const positions = positionsFrom(set.positions);
              return <article key={set.id} className={styles.receipt}>
                <header>
                  <div>
                    <span>{originalVersion ? `V${originalVersion.number}` : "Prior version"} · Receipt {set.id}</span>
                    <h3>{set.representedInstitution}</h3>
                    <p>{set.actor.displayName ?? set.actor.name ?? set.actor.email} · {set.representativeCapacity}</p>
                  </div>
                  <time dateTime={set.recordedAt.toISOString()}>{set.recordedAt.toLocaleString()}</time>
                </header>
                <ol>{positions.map((position, index) => <li key={String(position.reference ?? index)}>
                  <div>
                    <span>{String(position.reference ?? "")}</span>
                    <strong>{String(position.responseType ?? "")}</strong>
                  </div>
                  {typeof position.note === "string" && position.note ? <p>{position.note}</p> : null}
                </li>)}</ol>
              </article>;
            })}
          </>
        )}
        </div>
      </details>
      <details id="gm-drafting" className={`${styles.section} ${styles.sectionDisclosure}`} open>
        <summary className={styles.sectionSummary}>
          <div><span>04 / Drafting</span><h2>Master agreement drafting threshold</h2></div>
          <strong>{draftingGate.ok ? "READY" : "HOLD"}</strong>
        </summary>
        <div className={styles.sectionBody}>
        <p>Recorded positions support review. Only a separate operator decision opens preparation of a proposed agreement; authority and execution remain later steps.</p>
        {draftingDecisions.length ? draftingDecisions.map(decision => <article className={styles.item} key={decision.id}>
          <div><strong>{decision.standing === "OPEN_DRAFTING" ? "Proposed drafting opened" : "Held for review"}</strong>
            <span>{decision.actor.displayName ?? decision.actor.name ?? decision.actor.email} · {decision.recordedAt.toLocaleString()}</span>
            <p>{decision.rationale}</p>
            <small>{Array.isArray(decision.reviewedReceiptIds) ? decision.reviewedReceiptIds.length : 0} receipts reviewed</small>
          </div>
        </article>) : <p>No drafting decision recorded.</p>}
        {version?.status === "ISSUED" && instrument.currentVersion === globalMotherV3Definition.version
          ? <DraftingDecisionControl key={receipts.map(set => set.id).join(":")} versionId={version.id}
              receiptIds={receipts.map(set => set.id)} gate={draftingGate} /> : null}
        </div>
      </details>
        </div>
      </div>
      </div>
    </main>
  );
}
