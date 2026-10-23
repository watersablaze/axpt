import Link from "next/link";
import {loadPreview} from "../loadPreview";
import chrome from "../preview.module.css";
import styles from "../../../../../../french-ward/dossiers/dossier.module.css";
export const dynamic="force-dynamic";
export const metadata={title:"Buyer Dossier · Recipient Document List",robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{dossierId:string}>}) {
 const {dossierId}=await params;const {dossier}=await loadPreview(dossierId);
 if(!dossier)return <main className={chrome.document}><div className={styles.reception}><h1>Recipient access is unavailable</h1><p>The recorded recipient does not currently pass the dossier access checks. No permissions have been changed.</p></div></main>;
 const base=`/admin/representative-program/buyer-dossiers/${encodeURIComponent(dossier.id)}/preview`;
 return <div className={chrome.document}><main className={styles.reception}>
 <header className={styles.header}><span>FRENCH-WARD, INC.</span><span>Selected Documents</span></header>
 <section className={styles.welcome}><p className={styles.eyebrow}>Prepared for {dossier.recipientName}</p><h1>Your French-Ward documents</h1><p>Review the materials selected for your introduction. Return through your invitation to continue reviewing them.</p><p className={styles.meta}>Access expires {dossier.expiresAt.toISOString().slice(0,16).replace("T"," ")} UTC</p></section>
 <div className={styles.documents}>{dossier.items.map(item=><article key={item.id} className={styles.document}><p className={styles.meta}>{item.reference} · Edition {item.version}</p><h2>{item.label}</h2>{item.available?<Link className={styles.open} href={`${base}/publications/${encodeURIComponent(item.id)}`} prefetch={false}>Open full document →</Link>:<p>This publication is currently unavailable. Contact French-Ward for assistance.</p>}</article>)}</div>
 <section className={styles.document} style={{marginTop:24}} aria-label="Letter of Intent and Transaction Intake"><p className={styles.eyebrow}>Commercial Intake</p><h2>Letter of Intent &amp; Transaction Intake</h2><p className={styles.meta}>{dossier.loiAccess?.available?"LOI access is included in your invitation. You may open the form and submit your proposed transaction for French-Ward review. Submission does not approve a transaction.":dossier.loiAccess?"LOI access under this invitation is currently unavailable. Contact French-Ward for assistance.":"LOI access was not included in this invitation. You may request access through French-Ward’s commercial intake."}</p><Link className={styles.open} href="/admin/instruments/french-ward-commercial-intake/preview" target="_blank" rel="noopener noreferrer">Inspect LOI separately in admin preview ↗</Link></section>
 <footer className={styles.footer}>For correspondence: french-ward@axpt.io</footer>
 </main></div>;
}
