import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
export const dynamic="force-dynamic";
export const runtime="nodejs";
type DossierRow={id:string;recipientName:string;recipientEmail:string;recipientOrganization:string;purpose:string;expiresAt:Date;revokedAt:Date|null;createdAt:Date;recipientDeliveryStatus:string;adminDeliveryStatus:string;participant:{displayName:string};items:Array<{label:string;resourceReference:string;resourceVersion:number;grant:{revokedAt:Date|null;expiresAt:Date}}>};
export default async function BuyerDossiersPage(){
 const principal=await getPrincipal();
 if(!principal)redirect("/login?next=%2Fadmin%2Frepresentative-program%2Fbuyer-dossiers");
 if(!isAdmin(principal))notFound();
 const rows=await prisma.representativeBuyerDossier.findMany({orderBy:{createdAt:"desc"},take:50,select:{id:true,recipientName:true,recipientEmail:true,recipientOrganization:true,purpose:true,expiresAt:true,revokedAt:true,createdAt:true,recipientDeliveryStatus:true,adminDeliveryStatus:true,participant:{select:{displayName:true}},items:{select:{label:true,resourceReference:true,resourceVersion:true,grant:{select:{revokedAt:true,expiresAt:true}}}}}});
 return <main className="min-h-screen bg-gray-950 p-6 text-gray-100">
  <Link href="/admin/representative-program" className="text-sm underline">Representative Program</Link>
  <h1 className="mt-5 text-2xl">Buyer Introductions</h1>
  <p className="mt-2 text-sm text-gray-400">Latest 50 dossiers. Provider acceptance does not establish document viewing.</p>
  <Link href="/admin/institutional-access" className="mt-3 inline-block text-sm underline">Institutional Access Administration</Link>
  <div className="mt-6 space-y-4">{rows.map((row:DossierRow)=><article key={row.id} className="rounded border border-gray-700 p-4">
    <h2 className="font-medium">{row.participant.displayName} → {row.recipientName}</h2>
    <p className="text-sm">{row.recipientEmail} · {row.recipientOrganization}</p>
    <p className="mt-2 whitespace-pre-wrap text-sm">{row.purpose}</p>
    <p className="mt-3 text-sm">Recipient email: {row.recipientDeliveryStatus} · Admin email: {row.adminDeliveryStatus}</p>
    <p className="text-sm">Dossier: {row.revokedAt?"Revoked":row.expiresAt<=new Date()?"Expired":"Granted"} · expires {row.expiresAt.toISOString()}</p>
    <ul className="mt-3 list-inside list-disc text-sm">{row.items.map(item=><li key={item.resourceReference}>{item.label} · {item.resourceReference} · Edition {item.resourceVersion} · {item.grant.revokedAt?"Grant revoked":item.grant.expiresAt<=new Date()?"Grant expired":"Grant active"}</li>)}</ul>
    <p className="mt-3 break-all font-mono text-xs text-gray-500">{row.id} · {row.createdAt.toISOString()}</p>
  </article>)}</div>
 </main>;
}
