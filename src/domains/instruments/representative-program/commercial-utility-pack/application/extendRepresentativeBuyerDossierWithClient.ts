import type { PrismaClient } from "@prisma/client";
import { loadRecipientBuyerDossierWithClient } from "./loadRecipientBuyerDossierWithClient";
type Transaction = Parameters<typeof loadRecipientBuyerDossierWithClient>[0]["client"] &
  Pick<PrismaClient, "$queryRaw" | "domainEvent">;


export type BuyerDossierExtensionDays = 14 | 30 | 60;
const DAY = 86400000;
const LIMIT = 90 * DAY;

/**
 * Institutional access maintenance: extends one still-valid dossier and its
 * exact, existing item/LOI grants. Does not issue, revive, or expand grants.
 * Separate from representative issuance and separate from email delivery.
 */
export async function extendRepresentativeBuyerDossierWithClient(input: {
  client: PrismaClient;
  dossierId: string;
  operatorUserId: string;
  days: BuyerDossierExtensionDays;
  expectedExpiresAt: string;
}) {
  if (!input.dossierId || input.dossierId.length > 191 || !input.operatorUserId ||
      ![14, 30, 60].includes(input.days) ||
      !Number.isFinite(new Date(input.expectedExpiresAt).getTime())) {
    throw new Error("BUYER_DOSSIER_EXTENSION_INVALID");
  }
  return input.client.$transaction(async (tx: Transaction) => {
    await tx.$queryRaw`SELECT id FROM "RepresentativeBuyerDossier" WHERE id = ${input.dossierId} FOR UPDATE`;
    const dossier = await tx.representativeBuyerDossier.findUnique({
      where: { id: input.dossierId },
      include: { items: { select: { grantId: true } } },
    });
    const now = new Date();
    if (!dossier || dossier.revokedAt || dossier.expiresAt <= now ||
        dossier.expiresAt.toISOString() !== input.expectedExpiresAt ||
        dossier.items.length < 1 || dossier.items.length > 6 ||
        new Set(dossier.items.map((item: { grantId: string }) => item.grantId)).size !== dossier.items.length) {
      throw new Error("BUYER_DOSSIER_EXTENSION_UNAVAILABLE");
    }
    const ids = [...dossier.items.map((item: { grantId: string }) => item.grantId),
      ...(dossier.loiAccessGrantId ? [dossier.loiAccessGrantId] : [])].sort();
    await tx.$queryRaw`SELECT id FROM "InstitutionalAccessGrant" WHERE id = ANY(${ids}::text[]) ORDER BY id FOR UPDATE`;
    const grants = await tx.institutionalAccessGrant.findMany({
      where: { id: { in: ids } },
      select: { id: true, requestId: true, recipientUserId: true, recipientEmail: true,
        revokedAt: true, expiresAt: true, request: { select: { status: true } } },
    });
    if (grants.length !== ids.length || grants.some((grant: { revokedAt: Date | null; expiresAt: Date; recipientUserId: string; recipientEmail: string; request: { status: string } }) =>
      grant.revokedAt !== null || grant.expiresAt <= now ||
      grant.expiresAt.getTime() !== dossier.expiresAt.getTime() ||
      grant.recipientUserId !== dossier.recipientUserId ||
      grant.recipientEmail !== dossier.recipientEmail ||
      grant.request.status !== "APPROVED")) {
      throw new Error("BUYER_DOSSIER_EXTENSION_GRANT_CONFLICT");
    }
    const current = await loadRecipientBuyerDossierWithClient({
      client: tx, dossierId: dossier.id,
      userId: dossier.recipientUserId, email: dossier.recipientEmail, at: now,
    });
    if (!current || current.items.length !== dossier.items.length ||
        current.items.some(item => !item.available) ||
        (current.loiAccess && !current.loiAccess.available)) {
      throw new Error("BUYER_DOSSIER_EXTENSION_ACCESS_UNAVAILABLE");
    }
    const expiresAt = new Date(dossier.expiresAt.getTime() + input.days * DAY);
    if (expiresAt.getTime() - now.getTime() > LIMIT) {
      throw new Error("BUYER_DOSSIER_EXTENSION_LIMIT");
    }
    const updated = await tx.institutionalAccessGrant.updateMany({
      where: { id: { in: ids }, revokedAt: null, expiresAt: dossier.expiresAt },
      data: { expiresAt },
    });
    if (updated.count !== ids.length) throw new Error("BUYER_DOSSIER_EXTENSION_CONFLICT");
    await tx.representativeBuyerDossier.update({
      where: { id: dossier.id },
      data: { expiresAt },
    });
    await tx.domainEvent.create({
      data: { streamType: "RepresentativeBuyerDossier", streamId: dossier.id,
        eventType: "REPRESENTATIVE_BUYER_DOSSIER_ACCESS_EXTENDED",
        payload: { operatorUserId: input.operatorUserId,
          previousExpiresAt: dossier.expiresAt.toISOString(), expiresAt: expiresAt.toISOString(),
          days: input.days, existingGrantIds: ids } },
    });
    return { dossierId: dossier.id, previousExpiresAt: dossier.expiresAt.toISOString(),
      expiresAt: expiresAt.toISOString(), extendedGrantCount: ids.length };
  }, { isolationLevel: "Serializable", maxWait: 10000, timeout: 30000 });
}
