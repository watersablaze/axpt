import {redirect, notFound} from "next/navigation";
import {getPrincipal} from "@/domains/auth/getPrincipal";
import {isAdmin} from "@/domains/auth/isAdmin";
import {prisma} from "@/infrastructure/db/prisma";
import {loadRecipientBuyerDossierWithClient} from "@/domains/instruments/representative-program/commercial-utility-pack/application/loadRecipientBuyerDossierWithClient";
/** Admin-only read-only projection using the recorded recipient identity, never a substitute session. */
export async function loadPreview(dossierId: string) {
 const principal=await getPrincipal();
 if(!principal) redirect("/login?next="+encodeURIComponent(`/admin/representative-program/buyer-dossiers/${dossierId}/preview`));
 if(!isAdmin(principal)) notFound();
 if(!/^[A-Za-z0-9-]{1,191}$/.test(dossierId)) notFound();
 const record=await prisma.representativeBuyerDossier.findUnique({where:{id:dossierId},select:{id:true,recipientUserId:true,recipientEmail:true,recipientName:true,expiresAt:true,revokedAt:true}});
 if(!record) notFound();
 const dossier=await loadRecipientBuyerDossierWithClient({client:prisma,dossierId,userId:record.recipientUserId,email:record.recipientEmail});
 return {record,dossier};
}
