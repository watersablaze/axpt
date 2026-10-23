import s from "@/app/admin/instruments/program-sco-variants/[variant]/programScoVariant.module.css";
// GSAM-3L2S2-SIGNATORY-BINDING: server-only inline asset, never a public file URL.
import { readFileSync } from "node:fs";
import { join } from "node:path";
const jamesCrawfordSignatureDataUri = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "src/assets/gsam/institutional/james-crawford-signature.png")
).toString("base64")}`;

/** Shared document canvas — no AXPT controls, links or operator chrome. */
export default function GsamScoCanvas({ v }: { v: { quantityMt: number; reference: string } }) {
  const growthcorp = true;
  return (
    <article className={s.document} aria-label={`${growthcorp ? "Growthcorp commercial mandate" : "French-Ward"} ${v.quantityMt} metric tonne Soft Corporate Offer`}>
      <header className={`${s.masthead} ${growthcorp ? s.mastheadGrowthcorp : ""}`}>
        {growthcorp ? (
          <div className={s.gsamHeaderStack}>
            <strong><span className={s.monogram} aria-hidden="true">GS</span> GROWTHCORP SOLUTIONS ASSET MANAGEMENT LIMITED</strong>
            <div className={s.gsamHeaderDetails} aria-label="Growthcorp supplied institutional details">
              <span>171 Wilmslow Road · Manchester · Lancashire M14 5AP</span>
              <span>Registration no. 15377471</span>
              <span>+44 (0)2038 580 388</span>
            </div>
          </div>
        ) : (
          <strong><span className={s.monogram} aria-hidden="true">FW</span> FRENCH-WARD, INC.</strong>
        )}
        <span>SOFT CORPORATE OFFER</span>
      </header>
      <div className={s.documentGrid}>
        <aside className={`${s.rail} ${growthcorp ? s.railGrowthcorp : s.railFrenchWard}`} aria-label="Institutional instrument identity">
          <div className={s.railIdentity}>
            <span className={s.railLabel}>{growthcorp ? "COMMERCIAL MANDATE" : "COMMERCIAL PRESENTATION"}</span>
            <strong className={s.railTitle}>Gold Doré<br/>Supply</strong>
            <span className={s.railOrigin}>Republic of Mali</span>
          </div>
          <div className={s.railBottom}>
            <span className={s.railClassLabel}>DOCUMENTARY CLASS</span>
            <strong className={s.railClass}>Soft Corporate Offer</strong>
            <span className={s.railPosture}>Indicative · Subject to confirmation</span>
            <span className={s.railReference}>{v.reference}</span>
          </div>
        </aside>
        <div className={s.content}>
          <div className={s.intro}>
            <span className={s.eyebrow}>INDICATIVE COMMERCIAL PROPOSITION</span>
            <h1>Soft Corporate Offer</h1>
            <p className={s.subtitle}>Gold Doré Supply</p>
            <p className={s.deck}>{growthcorp ? "Growthcorp Solutions Asset Management Limited (GSAM) hereby presents this Soft Corporate Offer for the supply of Malian gold doré bars under its authorized commercial mandate, on the terms and conditions set forth herein." : "French-Ward, Inc. presents this indicative proposal for Malian gold doré under the program volume and pricing basis stated herein, subject to source confirmation and mutually agreed commercial conditions."}</p>
          </div>
          <section className={s.offerParticulars} aria-label="Commercial particulars">
            <div className={s.blockHeading}><span>01 / COMMERCIAL PROPOSITION</span><h2>The Offer</h2></div>
            <div className={s.offerFacts}>
              <div><span>PRODUCT / ORIGIN</span><strong>Gold Doré Bars</strong><small>Republic of Mali</small></div>
              <div><span>PROPOSED PROGRAM</span><strong>{v.quantityMt.toLocaleString("en-US")} MT</strong><small>Indicative volume · allocation unconfirmed</small></div>
              <div><span>MINIMUM GOLD CONTENT</span><strong>96% Au</strong><small>Subject to final refinery assay</small></div>
              <div><span>INDICATIVE PRICE</span><strong>LBMA − 5%</strong><small>Final-assay payable gold</small></div>
              <div><span>TRANSACTION TAP</span><strong>Conditional</strong><small>Export activation · Government-required passage</small></div>
            </div>
            <p className={s.offerSource}>{growthcorp ? "Presented by Growthcorp Solutions Asset Management Limited under its commercial mandate. Specific lots, allocation and tranche schedules are established through the governing transaction documents." : "Presented by French-Ward through its documented commercial relationship with Coopérative de Bafoula; lot particulars and allocation require confirmation."} Final purity and payable metal are subject to refinery assay and governing transaction documents.</p>
          </section>
          <section className={s.offerConditions} aria-label="Commercial conditions">
            <div className={s.blockHeading}><span>02 / COMMERCIAL CONDITIONS</span><h2>Terms &amp; Documentary Conditions</h2></div>
            <dl className={s.conditionRows}>
              <div><dt>Supply &amp; allocation</dt><dd>Proposed {v.quantityMt.toLocaleString("en-US")} MT program, subject to confirmed source capacity, allocation and mutually agreed tranches. No inventory is reserved by this offer.</dd></div>
              <div><dt>Price &amp; assay</dt><dd>Applicable LBMA Gold Price less 5% on final-assay payable gold. Fixing, adjustments and settlement calculation are to be agreed.</dd></div>
              <div><dt>Delivery &amp; settlement</dt><dd>Destination, export clearance, custody, refinery and payment mechanics are determined in the definitive transaction documents.</dd></div>
              <div><dt>Transaction Activation Payment (TAP)</dt><dd>The Transaction Activation Payment (TAP) is a required component of the proposed transaction, supporting government-required export and shipment-release procedures for Malian gold, including export authorization (autorisation d’exportation), export intention filing (intention d’exportation), and customs formalities (formalités douanières). The applicable TAP amount, payment schedule and settlement treatment are established in the governing transaction agreement. This Soft Corporate Offer contains no remittance instructions and does not itself require immediate payment.</dd></div>
              <div><dt>Documentary passage</dt><dd>Commercial qualification, source confirmation and governing agreements are required. A Transaction Overview may accompany an expressly authorized package.</dd></div>
            </dl>
          </section>
          <section className={`${s.offerPassage} ${s.sandPassage}`} aria-label="Commercial progression">
            <div className={s.blockHeading}><span>03 / COMMERCIAL PASSAGE</span><h2>From Interest to Agreement</h2></div>
            <ol className={s.offerSteps}>
              <li><b>01</b><span>Commercial qualification</span></li>
              <li><b>02</b><span>Source confirmation &amp; program scheduling</span></li>
              <li><b>03</b><span>Definitive agreement &amp; authorized execution</span></li>
            </ol>
            <p className={s.offerQualification}>Metric-tonne and continuing-supply volumes are indicative programs, not proof of allocated inventory or guaranteed delivery. {growthcorp ? "Commercial correspondence and transaction coordination are directed through Growthcorp Solutions Asset Management Limited, attention James Crawford." : "Interested counterparties may proceed through French-Ward's authorized representatives."}</p>
          </section>
          <section className={`${s.execution} ${s.sandExecution}`} aria-label="Institutional signature area">
            <div className={s.executionHeading}>
              <span>04 / INSTITUTIONAL EXECUTION</span>
              <h2>Signature and authorization</h2>
              <p>{growthcorp ? "For and on behalf of Growthcorp Solutions Asset Management Limited." : "For execution by a duly authorized institutional signatory."}</p>
            </div>
            {/* GSAM-3L2S3-EXECUTION-CLEANUP: no duplicate signatory metadata or blank date. */}
            <div className={`${s.executionFields} ${growthcorp ? s.gsamExecutionFields : ""}`}>
              <div className={s.executionSignature}>
                {growthcorp ? (
                  <>
                    <img className={s.gsamAuthorizedSignature} src={jamesCrawfordSignatureDataUri} alt="James Crawford signature" />
                    <span className={s.signatureLine} aria-hidden="true"></span>
                    <strong>James Crawford</strong>
                    <small className={s.gsamSignatoryTitle}>Vice President &amp; Authorized Signatory</small>
                    <small>Growthcorp Solutions Asset Management Limited</small>
                  </>
                ) : (
                  <>
                    <span className={s.signatureLine} aria-hidden="true"></span>
                    <strong>Authorized signature</strong>
                    <small>For French-Ward, Inc. · Commercial presenter</small>
                  </>
                )}
              </div>
              {!growthcorp && (
                <div className={s.executionMeta}>
                  <div><span>NAME / TITLE</span><i aria-hidden="true"></i></div>
                  <div><span>DATE</span><i aria-hidden="true"></i></div>
                </div>
              )}
            </div>
            {growthcorp && <p className={s.executionCaveat}>James Crawford coordinates commercial correspondence and is the designated Vice President &amp; Authorized Signatory. Edition-specific authorization remains subject to institutional confirmation.</p>}
          </section>
          <footer className={s.footer}>
            <strong>{growthcorp ? "GROWTHCORP SOLUTIONS ASSET MANAGEMENT LIMITED" : "FRENCH-WARD, INC."} <span>· {growthcorp ? "COMMERCIAL MANDATE / JAMES CRAWFORD" : "COMMERCIAL ADMINISTRATION"}</span></strong>
            <span>{growthcorp ? "Commercial mandate · Offer" : "Commercial presentation · Offer"}</span>
          </footer>
        </div>
      </div>
    </article>
  );
}
