import {redirect} from "next/navigation";
import Link from "next/link";
import {getPrincipal} from "@/domains/auth/getPrincipal";
import {PERMISSIONS} from "@/domains/auth/permissions";
import {prisma} from "@/infrastructure/db/prisma";
import {GSAM_EMAIL,GSAM_DELIVERY_KEY,renderGsamEmail,verifyGsamDeliveryGrants} from "@/domains/institutional-access/gsamDelivery";
import {DeliveryControl} from "./DeliveryControl";
import {verifyGsamEdition2ArtifactsReady} from "@/domains/instruments/transaction-documents/gsamRecipientFrozenDocument";
export const dynamic="force-dynamic";
export default async function GsamDeliveryPage(){
 const principal=await getPrincipal();if(!principal)redirect("/login?next=%2Fadmin%2Finstruments%2Fgsam-sco%2Fdelivery");
 if(!principal.permissions.includes(PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE))return <main>Access denied</main>;
 let ready=false;try{await verifyGsamDeliveryGrants();await verifyGsamEdition2ArtifactsReady();ready=true;}catch{}
 const receipt=await prisma.gsamEmailDelivery.findUnique({where:{key:GSAM_DELIVERY_KEY}});
 const rendered=renderGsamEmail();
 return <main style={{maxWidth:850,margin:"40px auto",padding:24}}><h1>GSAM — Institutional Delivery</h1><p>Recipient: {GSAM_EMAIL}</p><p>100 MT and 1,000 MT · Grants and frozen custody: {ready?"verified":"not ready"}</p><p>Delivery: {receipt?.status??"NOT SENT"} {receipt?.messageId?`· ${receipt.messageId}`:""}</p><p><Link href="/admin/instruments/gsam-sco/reception-preview">Preview James’s Reception Room →</Link></p><h2>Message preview</h2><iframe title="GSAM institutional email" sandbox="" srcDoc={rendered.html} style={{width:"100%",height:650,border:"1px solid #777"}}/><h2>Operator action</h2>{ready&&!receipt?<DeliveryControl/>:<p>{receipt?"Existing delivery claim prevents another send.":"No send permitted until grants and all four Edition 2 artifacts validate."}</p>}</main>;
}
