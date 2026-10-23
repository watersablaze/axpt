import Link from "next/link";
import {notFound} from "next/navigation";
import {loadPreview} from "../../loadPreview";
import chrome from "../../preview.module.css";
import styles from "../../../../../../../french-ward/dossiers/dossier.module.css";
import {TovPublicationView} from "@/components/french-ward/transaction-overview/TovPublicationView";
import {FrenchWardInstitutionalProfileView} from "@/components/french-ward/profile/FrenchWardInstitutionalProfileView";
export const dynamic="force-dynamic";
export const metadata={title:"Buyer Publication · Admin Recipient Preview",robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{dossierId:string;itemId:string}>}) {
 const {dossierId,itemId}=await params;const {dossier}=await loadPreview(dossierId);
 const item=dossier?.items.find(entry=>entry.id===itemId);
 if(!dossier||!item)notFound();
 const publication=item.available?item.publication:null;
 return <div className={chrome.document}><main className={styles.profile}><nav className={styles.navigation} aria-label="Document navigation"><Link href={`/admin/representative-program/buyer-dossiers/${encodeURIComponent(dossier.id)}/preview/document`}>← Your documents</Link><span>{item.reference} · Edition {item.version}</span></nav>
 {!publication?<p>This publication is currently unavailable under the recorded recipient’s access checks.</p>:publication.kind==="TRANSACTION_OVERVIEW"?<TovPublicationView html={publication.content.html} publicationRevision={publication.content.publicationRevision}/>:publication.kind==="INSTITUTIONAL_PROFILE"?<FrenchWardInstitutionalProfileView profile={publication.content}/>:<p>This document type requires its separate administrative reader. This preview currently supports TOV and Profile rendering.</p>}
 </main></div>;
}
