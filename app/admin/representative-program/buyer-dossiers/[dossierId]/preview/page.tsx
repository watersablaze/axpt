import {loadPreview} from "./loadPreview";
import DossierPreview from "./DossierPreview";
export const dynamic="force-dynamic";
export const metadata={title:"Buyer Dossier · Recipient Preview",robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{dossierId:string}>}) {
 const {dossierId}=await params;
 const {record}=await loadPreview(dossierId);
 return <DossierPreview dossierId={record.id} recipientEmail={record.recipientEmail} />;
}
