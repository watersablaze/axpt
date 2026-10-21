import { frenchWardTransactionOverview as document } from "@/domains/institutions/french-ward/frenchWardTransactionOverview";
import styles from "./FrenchWardTransactionOverviewView.module.css";
import { TOV_TRADE_PASSAGE_SVG } from "./tovTradePassagePlate";

const procedure = document.sections.find(s => s.id === "standard-transaction-procedure")!;
const supporting = document.sections.filter(s => s.id !== "standard-transaction-procedure" && s.id !== "supply-commercial-standing");
const supply = document.sections.find(s => s.id === "supply-commercial-standing")!;
function steps() {
  return procedure.paragraphs.reduce<{ title: string; body: string }[]>((result, paragraph) => {
    const match = paragraph.match(/^(\d{2}) \| (.+?)\. (.*)$/);
    if (match) result.push({ title: match[2], body: match[3] });
    else if (result.length) result[result.length - 1].body += " " + paragraph;
    return result;
  }, []);
}

/** Standing review publication. Rights, routing and issuance are controlled by host. */
export function FrenchWardTransactionOverviewView() {
  return <article className={styles.document}>
    <header className={styles.masthead}>
      <div className={styles.brandLine}><strong><i className={styles.instrumentMark} aria-hidden="true">FW / P</i>{document.issuer}</strong><span>STANDING COMMERCIAL PROCEDURE</span></div>
      <div className={styles.documentIdentity}><span>{document.reference}</span><span>Edition {String(document.version).padStart(2, "0")} · {document.status}</span></div>
      <div className={styles.heroComposition}><div className={styles.heading}><span className={styles.kicker}>GOLD SUPPLY / TRANSACTION SUPPORT</span><h1>{document.title}</h1><p>{document.orientation}</p></div><figure className={styles.heroGraphite}><img src="/french-ward/commercial-papers/tov-dore-graphite.webp" alt="" loading="eager" /><figcaption>ILLUSTRATIVE DORÉ · NOT INVENTORY EVIDENCE</figcaption></figure></div>
      <div className={styles.keyFacts}>
        <div><span>MINIMUM INITIAL TRANCHE</span><strong>50 KG</strong></div>
        <div><span>COMMODITY</span><strong>Gold doré · 96% Au min.</strong></div>
        <div><span>SOURCE</span><strong>Coopérative de Bafoula · Mali</strong></div>
        <div><span>DEFAULT ACTIVATION</span><strong>7.5% Good-Faith TAP</strong></div>
      </div>
    </header>
    <main className={styles.body}>
      <section className={styles.source} aria-labelledby="tov-source"><div className={styles.smallIndex}>01 / SUPPLY & CAPACITY</div><div><h2 id="tov-source">{supply.title}</h2>{supply.paragraphs.map((p,i)=><p key={i}>{p}</p>)}</div></section>
      <section className={styles.journey} aria-labelledby="tov-journey">
        <div className={styles.journeyHead}><div><span className={styles.smallIndex}>02 / THE TRANSACTION JOURNEY</span><h2 id="tov-journey">Seven stages. Source to settlement.</h2></div><p>Each stage proceeds subject to qualification, applicable approvals and executed transaction documents.</p></div>
        <figure className={styles.passagePlate}><img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(TOV_TRADE_PASSAGE_SVG)}`} alt="Conceptual marks for source strata, commercial record, transit and assay receipt" loading="lazy" /></figure>
        <ol className={styles.stages}>{steps().map((step,i)=><li key={i} className={i===3?styles.activeStage:undefined}><span className={styles.stageNum}>{String(i+1).padStart(2,"0")}</span><div><h3>{step.title}</h3><p>{step.body}</p></div>{i===3&&<span className={styles.stageFlag}>VERIFIED ACTIVATION</span>}</li>)}</ol>
      </section>
      <section className={styles.references} aria-labelledby="tov-support"><div className={styles.smallIndex}>03 / COMMERCIAL REFERENCE</div><div><h2 id="tov-support">Terms, passage & documentary conditions</h2><div className={styles.referenceGrid}>{supporting.map((section,i)=><section key={section.id} className={styles.referenceItem}><span>{String(i+1).padStart(2,"0")}</span><div><h3>{section.title}</h3>{section.paragraphs.map((p,j)=><p key={j}>{p}</p>)}</div></section>)}</div></div></section>
    </main>
    <footer className={styles.footer}><div><strong><i className={styles.instrumentMark} aria-hidden="true">FW / P</i>{document.issuer}</strong><span>{document.reference} · Edition {String(document.version).padStart(2,"0")}</span></div><p>This is a standing procedural reference, not an executed offer, payment instruction, or independent grant of authority.</p><small>{document.status} · {document.referenceStatus} · {document.preparationDate}</small></footer>
  </article>;
}
