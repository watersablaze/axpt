import { notFound } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { globalMotherV2Definition } from "@/domains/instruments/definitions/globalMotherV2Definition";
import styles from "./page.module.css";
import { IssueV2Control } from "./IssueV2Control";
import { GrantV2Control } from "./GrantV2Control";
import { RevokeV2Control } from "./RevokeV2Control";
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
    where: { reference: globalMotherV2Definition.reference },
    select: {
      id: true, reference: true, status: true, currentVersion: true,
      versions: { where: { number: 2 }, select: {
        id: true, number: true, status: true, issuedAt: true,
        propositions: { orderBy: { ordinal: "asc" }, select: { reference: true, title: true, body: true } },
      } },
      accessGrants: { orderBy: { issuedAt: "desc" }, select: {
        id: true, recipientName: true, recipientUserId: true,
        recipientRole: true, accessLevel: true, instrumentVersionId: true,
        representedInstitution: true, representativeCapacity: true,
        issuedAt: true, expiresAt: true, revokedAt: true,
        firstAccessAt: true, lastAccessAt: true,
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
  const version = instrument.versions[0];
  const v2Grants = instrument.accessGrants.filter(grant => grant.instrumentVersionId === version?.id);
  const receipts = instrument.responseSets.filter(set => set.versionId === version?.id);
  const draftingDecisions = instrument.draftingDecisions.filter(decision => decision.versionId === version?.id);
  const distinctInstitutions = new Set(receipts.map(set => set.representedInstitution.trim().toLowerCase())).size;
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
        <div><span>V2 standing</span><strong>{version?.status ?? "ABSENT"}</strong><small>{version?.issuedAt?.toLocaleString() ?? "Not issued"}</small></div>
        <div><span>Bound grants</span><strong>{v2Grants.length}</strong><small>{v2Grants.filter(grant => grant.firstAccessAt).length} accessed</small></div>
        <div><span>Response sets</span><strong>{receipts.length}</strong><small>{open} positions for discussion</small></div>
      </section>

      <div className={styles.workGrid}>
        <div className={styles.accessColumn}>
      <section className={`${styles.section} ${styles.integritySection}`}>
        <h2>Version integrity</h2>
        <p>{version?.propositions.length === 7 &&
          version.propositions.every((item, index) => item.reference === globalMotherV2Definition.propositions[index]?.reference &&
            item.body === globalMotherV2Definition.propositions[index]?.body)
          ? version.status === "ISSUED"
            ? "Seven issued positions match the Framework source."
            : "Seven draft positions match the Framework source. V2 remains unissued."
          : "The V2 proposition record does not match the seven-position source. Resolve before issuance or response."}</p>
        {version?.status === "DRAFT" && instrument.currentVersion === 1 &&
          version.propositions.length === 7 &&
          version.propositions.every((item, index) =>
            item.reference === globalMotherV2Definition.propositions[index]?.reference &&
            item.body === globalMotherV2Definition.propositions[index]?.body)
          ? <IssueV2Control versionId={version.id} /> : null}
      </section>

      <section className={styles.section}>
        <h2>Recipient access</h2>
        {version?.status === "ISSUED" && instrument.currentVersion === 2 ? <GrantV2Control versionId={version.id} /> : null}
        {v2Grants.length === 0 ? <p>No version-bound recipient grants.</p> : (
          <div className={styles.list}>
            {v2Grants.map(grant => <article key={grant.id} className={styles.item}>
              <div><strong>{grant.recipientName ?? grant.recipientUserId ?? "Unnamed recipient"}</strong>
                <span>{grant.representedInstitution ?? "Institution missing"} · {grant.representativeCapacity ?? "Capacity missing"}</span></div>
              <div><span>{grant.recipientRole} · {grant.accessLevel}</span>
                <small>{grant.revokedAt ? "Revoked" : grant.expiresAt && grant.expiresAt < new Date() ? "Expired" : grant.lastAccessAt ? "Accessed" : "Not accessed"}</small>
                {!grant.revokedAt ? <RevokeV2Control grantId={grant.id} /> : null}</div>
            </article>)}
          </div>
        )}
      </section>

        </div>
        <div className={styles.reviewColumn}>
      <section className={styles.section}>
        <h2>Recorded response sets</h2>
        {receipts.length === 0 ? <p>No V2 responses recorded.</p> : receipts.map(set => {
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
      </section>
      <section className={styles.section}>
        <h2>Master agreement drafting threshold</h2>
        <p>Recorded positions support review. Only a separate operator decision opens preparation of a proposed agreement; authority and execution remain later steps.</p>
        {draftingDecisions.length ? draftingDecisions.map(decision => <article className={styles.item} key={decision.id}>
          <div><strong>{decision.standing === "OPEN_DRAFTING" ? "Proposed drafting opened" : "Held for review"}</strong>
            <span>{decision.actor.displayName ?? decision.actor.name ?? decision.actor.email} · {decision.recordedAt.toLocaleString()}</span>
            <p>{decision.rationale}</p>
            <small>{Array.isArray(decision.reviewedReceiptIds) ? decision.reviewedReceiptIds.length : 0} receipts reviewed</small>
          </div>
        </article>) : <p>No drafting decision recorded.</p>}
        {version?.status === "ISSUED" && instrument.currentVersion === 2
          ? <DraftingDecisionControl key={receipts.map(set => set.id).join(":")} versionId={version.id}
              receiptIds={receipts.map(set => set.id)} distinctInstitutions={distinctInstitutions} /> : null}
      </section>
        </div>
      </div>
      </div>
    </main>
  );
}
