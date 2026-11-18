import type { Prisma, PrismaClient } from "@prisma/client";
import { renderRepresentativeBuyerDossierMessage, type BuyerDossierMessage } from "./deliverRepresentativeBuyerDossierWithClient";
import { loadRecipientBuyerDossierWithClient } from "./loadRecipientBuyerDossierWithClient";

type Send = (message: BuyerDossierMessage) => Promise<{ accepted: boolean; messageId?: string }>;
/**
 * One recoverable pre-provider failure only: ACCESS_UNAVAILABLE.
 * Never retry ACCEPTED, DELIVERY_UNKNOWN, SENDING, or ambiguous provider outcomes.
 * Recipient grants and publication validity must be rechecked under row locks.
 */
export async function retryRepresentativeBuyerDossierAccessNoticeWithClient(input: {
  client: PrismaClient;
  dossierId: string;
  operatorUserId: string;
  from: string;
  replyTo: string;
  send: Send;
}) {
  if (!input.dossierId || input.dossierId.length > 191 || !input.operatorUserId) {
    throw new Error("BUYER_DOSSIER_RETRY_INVALID");
  }
  const record = await input.client.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.$queryRaw`SELECT id FROM "RepresentativeBuyerDossier" WHERE id = ${input.dossierId} FOR UPDATE`;
    const dossier = await tx.representativeBuyerDossier.findUnique({
      where: { id: input.dossierId },
      include: {
        items: { orderBy: { resourceReleaseId: "asc" } },
        participant: { select: { displayName: true } },
        actor: { select: { email: true } },
      },
    });
    const now = new Date();
    if (!dossier || dossier.revokedAt || dossier.expiresAt <= now ||
        dossier.recipientDeliveryStatus !== "FAILED" ||
        dossier.recipientDeliveryError !== "ACCESS_UNAVAILABLE" ||
        dossier.items.length < 1 || dossier.items.length > 6) {
      throw new Error("BUYER_DOSSIER_RETRY_NOT_ELIGIBLE");
    }
    const ids = [...dossier.items.map(item => item.grantId),
      ...(dossier.loiAccessGrantId ? [dossier.loiAccessGrantId] : [])].sort();
    await tx.$queryRaw`SELECT id FROM "InstitutionalAccessGrant" WHERE id = ANY(${ids}::text[]) ORDER BY id FOR SHARE`;
    const view = await loadRecipientBuyerDossierWithClient({
      client: tx, dossierId: dossier.id,
      userId: dossier.recipientUserId, email: dossier.recipientEmail, at: now,
    });
    if (!view || view.items.length !== dossier.items.length ||
        view.items.some(item => !item.available) ||
        (view.loiAccess && !view.loiAccess.available)) {
      throw new Error("BUYER_DOSSIER_RETRY_ACCESS_UNAVAILABLE");
    }
    const updated = await tx.representativeBuyerDossier.updateMany({
      where: { id: dossier.id, recipientDeliveryStatus: "FAILED",
        recipientDeliveryError: "ACCESS_UNAVAILABLE", revokedAt: null },
      data: { recipientDeliveryStatus: "SENDING", recipientAttemptedAt: now,
        recipientDeliveryError: null },
    });
    if (updated.count !== 1) throw new Error("BUYER_DOSSIER_RETRY_CONFLICT");
    await tx.domainEvent.create({ data: {
      streamType: "RepresentativeBuyerDossier", streamId: dossier.id,
      eventType: "BUYER_DOSSIER_RECIPIENT_RETRY_CLAIMED",
      payload: { operatorUserId: input.operatorUserId, previousStatus: "FAILED",
        previousError: "ACCESS_UNAVAILABLE", recipientUserId: dossier.recipientUserId },
    } });
    return dossier;
  }, { isolationLevel: "Serializable", maxWait: 10000, timeout: 30000 });

  let status: "ACCEPTED" | "FAILED" | "DELIVERY_UNKNOWN" = "DELIVERY_UNKNOWN";
  let error: string | null = "PROVIDER_OUTCOME_UNKNOWN";
  let messageId: string | null = null;
  let message: BuyerDossierMessage | null = null;
  try {
    message = renderRepresentativeBuyerDossierMessage(
      { from: input.from, replyTo: input.replyTo }, record, "recipient",
    );
    const response = await input.send(message);
    if (response.accepted && response.messageId) {
      status = "ACCEPTED"; error = null; messageId = response.messageId;
    } else {
      // Even a provider rejection may be ambiguous. Hold, never automatically retry.
      status = "DELIVERY_UNKNOWN";
      error = "PROVIDER_RESULT_UNCONFIRMED";
    }
  } catch {
    status = "DELIVERY_UNKNOWN";
    error = "PROVIDER_OUTCOME_UNKNOWN";
  }
  await input.client.$transaction(async (tx: Prisma.TransactionClient) => {
    const updated = await tx.representativeBuyerDossier.updateMany({
      where: { id: record.id, recipientDeliveryStatus: "SENDING" },
      data: { recipientDeliveryStatus: status, recipientMessageId: messageId,
        recipientDeliveryError: error },
    });
    if (updated.count !== 1) throw new Error("BUYER_DOSSIER_RETRY_FINALITY_UNCERTAIN");
    await tx.emailLog.create({ data: {
      type: "ARP_BUYER_DOSSIER_RECIPIENT_RETRY",
      from: input.from, to: record.recipientEmail,
      subject: message?.subject ?? "French-Ward | Your selected documents",
      status, messageId,
      rawPayload: { dossierId: record.id, operatorUserId: input.operatorUserId,
        retryOf: "FAILED_ACCESS_UNAVAILABLE", error },
    } });
    await tx.domainEvent.create({ data: {
      streamType: "RepresentativeBuyerDossier", streamId: record.id,
      eventType: "BUYER_DOSSIER_RECIPIENT_RETRY_RECORDED",
      payload: { operatorUserId: input.operatorUserId, status, messageId, error },
    } });
  }, { maxWait: 10000, timeout: 15000 });
  return { dossierId: record.id, status, messageId, error };
}
