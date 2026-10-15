export type BuyerDossierAccessRecord = {
  recipientUserId: string; recipientEmail: string; recipient: { email: string };
  expiresAt: Date; revokedAt: Date | null;
};
export type BuyerDossierItemAccessRecord = {
  kind: string; grantId: string; resourceReference: string; resourceVersion: number;
  recipientContentHash: string;
  grant: {
    id: string; recipientUserId: string; recipientEmail: string; scope: string;
    resourceReference: string; resourceVersion: number; issuedAt: Date; expiresAt: Date; revokedAt: Date | null;
    request: { status: string; requesterEmail: string; scope: string; resourceReference: string; resourceVersion: number };
  };
};
export function buyerDossierIdentityAllowsAccess(input: {
  dossier: BuyerDossierAccessRecord; userId: string; email: string; at: Date;
}) {
  const { dossier, at } = input;
  const email = input.email.trim().toLowerCase();
  return Boolean(input.userId && email && Number.isFinite(at.getTime()) &&
    dossier.recipientUserId === input.userId && dossier.recipientEmail === email &&
    dossier.recipient.email === email && !dossier.revokedAt && dossier.expiresAt > at);
}
export function buyerDossierItemAllowsAccess(input: {
  dossier: BuyerDossierAccessRecord; item: BuyerDossierItemAccessRecord;
  userId: string; email: string; at: Date;
  current: { kind: string; reference: string; version: number; recipientContentHash: string } | null;
}) {
  if (!buyerDossierIdentityAllowsAccess(input)) return false;
  const { item, current, at } = input;
  const grant = item.grant;
  const scope = item.kind === "INSTITUTIONAL_PROFILE" ? "PROFILE_VIEW" : item.kind === "SOURCE_AUTHORITY" ? "SOURCE_AUTHORITY_VIEW" : ["DECLARATION_OF_TRUST", "RESELLER_AGREEMENT", "SANCTIONS_SCREENING"].includes(item.kind) ? "SUPPORTING_DOCUMENT_VIEW" : null;
  return Boolean(scope && current && Number.isInteger(item.resourceVersion) && item.resourceVersion > 0 &&
    /^[a-f0-9]{64}$/.test(item.recipientContentHash) &&
    grant.id === item.grantId && grant.recipientUserId === input.userId &&
    grant.recipientEmail === input.email.trim().toLowerCase() &&
    grant.scope === scope && grant.resourceReference === item.resourceReference &&
    grant.resourceVersion === item.resourceVersion && !grant.revokedAt &&
    grant.issuedAt <= at && grant.expiresAt > at &&
    grant.request.status === "APPROVED" && grant.request.requesterEmail === grant.recipientEmail &&
    grant.request.scope === scope && grant.request.resourceReference === item.resourceReference &&
    grant.request.resourceVersion === item.resourceVersion &&
    current.kind === item.kind && current.reference === item.resourceReference &&
    current.version === item.resourceVersion && current.recipientContentHash === item.recipientContentHash);
}
