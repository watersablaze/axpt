import { z } from "zod";
import { loadRepresentativeAuthorityRegister } from "./loadRepresentativeAuthorityRegister";
import { REPRESENTATIVE_AUTHORITY_KEY, REPRESENTATIVE_AUTHORITY_TITLE } from "../contracts";

const text = z.string().min(1).max(4000);
const list = z.array(text).max(50);
export const certificateAuthoritySchema = z.object({
  id: text,
  key: z.enum(["ARP.ACCESS", "ARP.INTRODUCTION", "ARP.COMMUNICATION",
    "ARP.PRESENTATION", "ARP.COORDINATION", "ARP.NEGOTIATION",
    "ARP.DOCUMENTARY_AUTHORITY", "ARP.BINDING_AUTHORITY"]),
  action: text,
  conditions: z.object({
    transactionReferences: list.optional(), counterpartyReferences: list.optional(),
    territory: list.optional(), documentClasses: list.optional(),
    requiresPriorApproval: z.boolean().optional(), approvalAuthority: text.optional(),
    monetaryLimit: text.optional(), allowWhileRestricted: z.boolean().optional(),
    notes: text.optional(),
  }).strict().nullable(),
  effectiveAt: z.string().datetime(), expiresAt: z.string().datetime().nullable(),
}).strict();
export const certificateAuthoritiesSchema = z.array(certificateAuthoritySchema)
  .min(1).max(8).superRefine((entries, context) => {
    if (new Set(entries.map(entry => entry.key)).size !== entries.length ||
        new Set(entries.map(entry => entry.id)).size !== entries.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicate certificate authority" });
    }
  });
export type CertificateAuthority = z.infer<typeof certificateAuthoritySchema>;

// Preserve record values; normalize object key order only for reproducible hashes.
export function canonicalCertificateJson(value: unknown): string {
  function sort(item: unknown): unknown {
    if (Array.isArray(item)) return item.map(sort);
    if (item && typeof item === "object") return Object.fromEntries(
      Object.entries(item).sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, sort(child)]),
    );
    return item;
  }
  return JSON.stringify(sort(value));
}

export async function loadCertificateAuthorities(params:
  Parameters<typeof loadRepresentativeAuthorityRegister>[0]) {
  const register = await loadRepresentativeAuthorityRegister(params);
  if (!register) throw new Error("[ARP_CERTIFICATE_AUTHORITY_REGISTER_REQUIRED]");
  return register.entries.flatMap(entry => {
    if (!entry.exercisable || entry.authority?.authorityClass !== "DELEGATED") return [];
    return [certificateAuthoritySchema.parse({
      id: entry.authority.id, key: entry.key, action: entry.authority.action,
      conditions: entry.authority.conditions ?? null,
      effectiveAt: entry.authority.effectiveAt.toISOString(),
      expiresAt: entry.authority.expiresAt?.toISOString() ?? null,
    })];
  }).sort((a, b) => a.key.localeCompare(b.key));
}

export function certificateAuthorityTitle(key: CertificateAuthority["key"]) {
  return REPRESENTATIVE_AUTHORITY_TITLE[key];
}

export function certificateAuthorityConditions(entry: CertificateAuthority): string[] {
  const conditions = entry.conditions;
  const result: string[] = [];
  if (conditions) {
    for (const [key, label] of [
      ["transactionReferences", "Transactions"], ["counterpartyReferences", "Counterparties"],
      ["territory", "Territory"], ["documentClasses", "Documents"],
    ] as const) {
      if (conditions[key]?.length) result.push(label + ": " + conditions[key]!.join(", "));
    }
    if (conditions.requiresPriorApproval) result.push(
      "Prior approval required" + (conditions.approvalAuthority ? ": " + conditions.approvalAuthority : ""),
    );
    if (conditions.monetaryLimit) result.push("Monetary limit: " + conditions.monetaryLimit);
    if (conditions.allowWhileRestricted) result.push("Permitted during restricted standing under recorded conditions");
    if (conditions.notes) result.push(conditions.notes);
  }
  if (entry.expiresAt) result.push("Authority expires: " + entry.expiresAt);
  return result;
}

// A reviewable configuration, never an automatic grant or a claim of worldwide scope.
export const INITIAL_COMMERCIAL_AUTHORITY_PLAN = [
  [REPRESENTATIVE_AUTHORITY_KEY.INTRODUCTION, "Introduce prospective counterparties to French-Ward across its approved commercial activities."],
  [REPRESENTATIVE_AUTHORITY_KEY.COMMUNICATION, "Communicate approved institutional information and relay commercial inquiries through French-Ward's designated channels."],
  [REPRESENTATIVE_AUTHORITY_KEY.PRESENTATION, "Present materials expressly released for presentation across French-Ward's approved commercial activities, preserving their issued content."],
  [REPRESENTATIVE_AUTHORITY_KEY.COORDINATION, "Arrange meetings and coordinate requested information for French-Ward's review across its approved commercial activities."],
].map(([authorityKey, action]) => ({
  authorityKey, authorityClass: "DELEGATED" as const, action,
  conditions: {
    notes: "Commercial terms and commitments require French-Ward approval. Material transmission requires separate resource permission. Activity remains subject to applicable mandates and recorded conditions.",
  },
}));
