import type { PrismaClient } from "@prisma/client";

type Transaction = Pick<PrismaClient, "$queryRaw" | "representativeBuyerDossier" | "institutionalAccessGrant" | "institutionalAccessEvent" | "domainEvent">;

/** Owner-only revocation. Shares dossier-first lock order with delivery; repeats do not duplicate audit. */
export async function revokeRepresentativeBuyerDossierWithClient(input: {client: PrismaClient; userId: string; dossierId: string}) {
  if (!input.userId.trim() || !input.dossierId.trim() || input.dossierId.length > 191) return false;
  return input.client.$transaction(async (tx: Transaction) => {
    await tx.$queryRaw`SELECT id FROM "RepresentativeBuyerDossier" WHERE id = ${input.dossierId} AND "actorUserId" = ${input.userId} FOR UPDATE`;
    const dossier = await tx.representativeBuyerDossier.findFirst({where:{id:input.dossierId,actorUserId:input.userId},select:{id:true,revokedAt:true,loiAccessGrantId:true,items:{select:{grantId:true}}}});
    if (!dossier) return false;
    if (dossier.revokedAt) return true;
    const at = new Date();
    const ids = [...dossier.items.map((item: {grantId: string}) => item.grantId), ...(dossier.loiAccessGrantId ? [dossier.loiAccessGrantId] : [])].sort();
    await tx.$queryRaw`SELECT id FROM "InstitutionalAccessGrant" WHERE id = ANY(${ids}::text[]) ORDER BY id FOR UPDATE`;
    const grants = await tx.institutionalAccessGrant.findMany({where:{id:{in:ids},revokedAt:null},select:{id:true,requestId:true}});
    await tx.representativeBuyerDossier.update({where:{id:dossier.id},data:{revokedAt:at}});
    await tx.institutionalAccessGrant.updateMany({where:{id:{in:ids},revokedAt:null},data:{revokedAt:at}});
    for (const grant of grants) await tx.institutionalAccessEvent.create({data:{requestId:grant.requestId,grantId:grant.id,type:"REVOKED",actorUserId:input.userId,metadata:{dossierId:dossier.id}}});
    await tx.domainEvent.create({data:{streamType:"RepresentativeBuyerDossier",streamId:dossier.id,eventType:"REPRESENTATIVE_BUYER_DOSSIER_REVOKED",payload:{actorUserId:input.userId,grantIds:ids}}});
    return true;
  },{isolationLevel:"Serializable",maxWait:10000,timeout:30000});
}
