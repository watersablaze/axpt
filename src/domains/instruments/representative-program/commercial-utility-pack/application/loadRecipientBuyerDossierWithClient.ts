import { resolveInstitutionalAccessWithClient } from "@/domains/institutional-access/resolveInstitutionalAccessWithClient";
import { FRENCH_WARD_COMMERCIAL_INTAKE } from "@/domains/institutions/french-ward/commercial";
import type { PrismaClient } from "@prisma/client";
import { buyerDossierIdentityAllowsAccess, buyerDossierItemAllowsAccess } from "./buyerDossierAccessPolicy";
import { loadBuyerDossierPublicationWithClient } from "./loadBuyerDossierPublicationWithClient";
type Client = Pick<PrismaClient, "representativeBuyerDossier" | "institutionalAccessGrant"> &
  Parameters<typeof loadBuyerDossierPublicationWithClient>[0]["client"];

/** Recipient principal only. No operator impersonation and no URL-supplied email.
 * Publication content is returned only after both invitation and exact item grant pass.
 * Each selected item is checked independently; revoking one does not authorize another.
 */
export async function loadRecipientBuyerDossierWithClient(input: {
  client: Client; dossierId: string; userId: string; email: string; at?: Date;
}) {
  const at = input.at ?? new Date();
  if (!input.dossierId || input.dossierId.length > 191 || !input.userId ||
      !input.email.trim() || !Number.isFinite(at.getTime())) return null;
  const dossier = await input.client.representativeBuyerDossier.findFirst({
    where: { id: input.dossierId, recipientUserId: input.userId,
      recipientEmail: input.email.trim().toLowerCase(), revokedAt: null, expiresAt: { gt: at } },
    include: { recipient: { select: { email: true } },
      items: { orderBy: { resourceReleaseId: "asc" }, include: { grant: { include: { request: true } } } } },
  });
  if (!dossier || !buyerDossierIdentityAllowsAccess({ ...input, dossier, at }) ||
      !dossier.items.length || dossier.items.length > 5 ||
      new Set(dossier.items.map((item: { kind: string }) => item.kind)).size !== dossier.items.length) return null;
  const items = [];
  for (const item of dossier.items) {
    const publication = await loadBuyerDossierPublicationWithClient({
      client: input.client, representativeUserId: dossier.actorUserId, resourceReleaseId: item.resourceReleaseId,
    });
    const allowed = buyerDossierItemAllowsAccess({ ...input, dossier, item, current: publication, at });
    items.push({ id: item.id, label: item.label, reference: item.resourceReference,
      version: item.resourceVersion, available: allowed, canDownload: allowed && item.canDownload,
      publication: allowed ? publication : null });
  }
  const intake = FRENCH_WARD_COMMERCIAL_INTAKE;
  const loi = dossier.loiAccessGrantId ? await resolveInstitutionalAccessWithClient({
    client: input.client, identity: { userId: input.userId, email: input.email },
    scope: intake.accessScope, action: "VIEW_FORM", resourceReference: intake.reference,
    resourceVersion: intake.version, grantId: dossier.loiAccessGrantId, now: at,
  }) : null;
  const loiAccess = dossier.loiAccessGrantId
    ? { included: true, available: Boolean(loi?.allowed), route: intake.route } : null;
  return { id: dossier.id, recipientName: dossier.recipientName, expiresAt: dossier.expiresAt, items, loiAccess };
}
