import { notFound } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { globalMotherCycleV2Plan } from "@/domains/instruments/definitions/globalMotherCycleV2Plan";
import { loadGlobalMotherChamberHomeWorkstreamsWithClient } from "@/domains/instruments/global-mother/loadGlobalMotherChamberHomeWorkstreamsWithClient";
import ChamberWorkspaceStage from "./ChamberWorkspaceStage";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const targetNames = {
  CASE: "Case",
  OPPORTUNITY: "Opportunity",
  TRANSACTION_DOSSIER: "Commercial dossier",
} as const;

export default async function GlobalMotherChamberHomePreview() {
  const principal = await getPrincipal();
  if (!isAdmin(principal)) notFound();

  // This is an Administration-only presentation. No recipient or
  // institutional instrument grant authorizes this Home projection.
  const plan = globalMotherCycleV2Plan;
  const projection = await loadGlobalMotherChamberHomeWorkstreamsWithClient(prisma);
  const established = projection.standing === "ESTABLISHED";
  const linked = established ? projection.workstreams : [];

  const home = (
    <div className={styles.homeView}>
      <div className={styles.hero}>
        <span className={styles.eyebrow}>THE INSTITUTIONAL HOME · {plan.cycleLabel.toUpperCase()}</span>
        <h1>Where shared intentions<br /><em>become enduring work.</em></h1>
        <p>A private place to recognize relationships, coordinate initiatives, preserve their passage, and understand the conditions of institutional action.</p>
        <div className={styles.heroFoot}>
          <span>Relationship precedes formal authority.</span>
          <span>ISSUANCE AND DELIVERY DISABLED</span>
        </div>
      </div>
      <div className={styles.homeHighlights}>
        <div><span className={styles.eyebrow}>INSTITUTIONAL PRESENCE</span><strong>{plan.participants.length}</strong><p>Planned participants · No admission inferred</p></div>
        <div><span className={styles.eyebrow}>SHARED UNDERTAKINGS</span><strong>{established ? linked.length : "—"}</strong><p>{established ? "Linked references · Metadata only" : "Canonical association withheld"}</p></div>
        <div><span className={styles.eyebrow}>CONSTITUTIONAL CONTINUITY</span><strong>{plan.movements.length}</strong><p>Movements defining the institutional framework</p></div>
      </div>
      <section className={styles.section} aria-labelledby="home-next-heading">
        <div className={styles.sectionTitle}>
          <div><span className={styles.eyebrow}>THE LIVING CHAMBER</span><h2 id="home-next-heading">A home with distinct places</h2></div>
          <span className={styles.secondaryLabel}>IN PREPARATION</span>
        </div>
        <p className={styles.intro}>Relationships, workstreams and the constitutional framework each have their own place. Formal participation remains governed by independent admission and authority requirements.</p>
        <div className={styles.homeDirectory}>
          <article><span>01 / RELATIONSHIPS</span><h3>Those shaping the relationship</h3><p>Three planned institutional participants and their asserted capacities.</p></article>
          <article><span>02 / WORKSTREAMS</span><h3>Shared undertakings</h3><p>Canonical case, opportunity and commercial dossier associations appear when established.</p></article>
          <article><span>03 / CONSTITUTION</span><h3>Five movements</h3><p>Relationship, authority, deliberation, agreement and conditions.</p></article>
        </div>
      </section>
    </div>
  );

  const relationships = (
    <section className={styles.section} aria-labelledby="relationships-heading">
      <div className={styles.sectionTitle}>
        <div><span className={styles.eyebrow}>01 / INSTITUTIONAL PRESENCE</span><h1 id="relationships-heading" className={styles.viewTitle}>Those shaping the relationship</h1></div>
        <span className={styles.secondaryLabel}>PLANNED · {plan.participants.length}</span>
      </div>
      <p className={styles.intro}>These people and institutions are named in the Chamber plan. Planning is not verification, admission or membership.</p>
      <div className={styles.participants}>
        {plan.participants.map((participant) => (
          <article className={styles.participant} key={participant.key}>
            <div><span className={styles.institution}>{participant.institution}</span><h3>{participant.name}</h3><p>{participant.capacity}</p></div>
            <span className={styles.planned}>PLANNED</span>
          </article>
        ))}
      </div>
    </section>
  );

  const workstreams = (
    <section className={styles.section} aria-labelledby="workstreams-heading">
      <div className={styles.sectionTitle}>
        <div><span className={styles.eyebrow}>02 / SHARED UNDERTAKINGS</span><h1 id="workstreams-heading" className={styles.viewTitle}>Workstreams</h1></div>
        <span className={styles.secondaryLabel}>{established ? `${linked.length} LINKED` : "WITHHELD"}</span>
      </div>
      <p className={styles.intro}>Initiatives and their associated cases or commercial dossiers will have a continuing place here. No hypothetical transactions are shown as actual records.</p>
      {projection.standing === "NOT_ESTABLISHED" ? (
        <div className={styles.empty}><strong>Workstream room not yet established</strong><p>No canonical Chamber room binding is available. Undertakings cannot be presented as linked.</p></div>
      ) : projection.standing === "REVIEW_REQUIRED" ? (
        <div className={styles.empty}><strong>Room topology requires review</strong><p>Workstream associations are withheld until the canonical Chamber binding is valid.</p></div>
      ) : linked.length === 0 ? (
        <div className={styles.empty}><strong>A place ready for its first undertaking</strong><p>There are no canonical cases, opportunities or commercial dossiers linked to this Chamber yet. Existing conversations do not automatically create workstreams.</p></div>
      ) : (
        <div className={styles.workstreamList}>
          {linked.map((workstream, index) => (
            <article className={styles.workstream} key={workstream.linkId}>
              <span className={styles.workstreamNumber}>{String(index + 1).padStart(2,"0")}</span>
              <div><h3>{targetNames[workstream.targetType]}</h3><p>Canonical association · Target contents withheld</p></div>
              <span className={styles.linkState}>LINK ONLY</span>
            </article>
          ))}
        </div>
      )}
      <p className={styles.caution}>A workstream association does not authorize access to its transaction, case or dossier.</p>
    </section>
  );

  const constitution = (
    <section className={styles.section} aria-labelledby="movements-heading">
      <div className={styles.sectionTitle}>
        <div><span className={styles.eyebrow}>03 / CONSTITUTIONAL CONTINUITY</span><h1 id="movements-heading" className={styles.viewTitle}>Five movements</h1></div>
        <span className={styles.secondaryLabel}>PREPARATION</span>
      </div>
      <p className={styles.intro}>The constitutional movements explain how a relationship may become a governed undertaking without presuming authority before its conditions are established.</p>
      <div className={styles.movementGrid}>
        {plan.movements.map((movement) => (
          <article key={movement.key} className={styles.movement}>
            <span>{String(movement.ordinal).padStart(2,"0")} / {movement.transition.replaceAll("_"," ")}</span>
            <h3>{movement.label}</h3>
            <p>{movement.proposition}</p>
          </article>
        ))}
      </div>
      <p className={styles.caution}><a href="/french-ward/instruments/gm-kenya?previewVersion=4">Open the separate constitutional instrument preview</a>. Its versioned access rules and historic responses are not Chamber Home membership.</p>
    </section>
  );

  const context = (
    <>
      <div className={styles.contextBlock}>
        <span className={styles.eyebrow}>CHAMBER POSTURE</span>
        <strong className={styles.contextBig}>{plan.standing}</strong>
        <p>Internal experience preview. No invitation, admission or institutional membership is conferred.</p>
      </div>
      <div className={styles.contextBlock}>
        <span className={styles.eyebrow}>INSTITUTIONAL BOUNDARY</span>
        <h2>Relationship does not confer authority.</h2>
        <p>Representative mandates, access to undertakings and formal acts each require independent conditions.</p>
      </div>
      <div className={styles.contextBlock}>
        <span className={styles.eyebrow}>WORKSTREAM TOPOLOGY</span>
        <p><strong>{projection.standing.replaceAll("_", " ")}</strong></p>
        <p>{linked.length} canonical link{linked.length === 1 ? "" : "s"} visible as metadata only.</p>
      </div>
      <div className={styles.contextBlock}>
        <span className={styles.eyebrow}>CURRENT LIMITS</span>
        <p>No participant admission, communication send, issuance, delivery or commercial release is enabled here.</p>
      </div>
    </>
  );

  return (
    <main className={styles.page}>
      <div className={styles.atmosphere} aria-hidden="true" />
      <header className={styles.topbar}>
        <div className={styles.mark} aria-label="Global Mother Chamber">GM<span> / </span>CHAMBER</div>
        <div className={styles.topRight}>
          <span>INTERNAL PARTICIPANT EXPERIENCE PREVIEW</span>
          <span className={styles.posture}>{plan.standing}</span>
        </div>
      </header>
      <ChamberWorkspaceStage
        cycleLabel={plan.cycleLabel}
        instrumentReference={plan.instrumentReference}
        participantCount={plan.participants.length}
        workstreamCount={established ? linked.length : null}
        home={home}
        relationships={relationships}
        workstreams={workstreams}
        constitution={constitution}
        context={context}
      />
      <footer className={styles.footer}>GLOBAL MOTHER · CHAMBER V2 <span>ADMIN-ONLY EXPERIENCE PREVIEW · NO AUTHORITY GRANTED</span></footer>
    </main>
  );
}
