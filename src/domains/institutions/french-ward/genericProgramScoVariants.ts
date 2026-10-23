// FW-SCO-2Q: GSAM recipient-facing commercial mandate language.
/** One institutional composition, two quantity-only variations. Drafts, not issuances. */
export const genericProgramScoVariants = {
  "100-mt": { presenter: "FRENCH_WARD" as const, reference: "FW-SCO-PROGRAM-100MT-2026-001", quantityMt: 100, quantityKg: 100000 },
  "1000-mt": { presenter: "FRENCH_WARD" as const, reference: "FW-SCO-PROGRAM-1000MT-2026-001", quantityMt: 1000, quantityKg: 1000000 },
  "gsam-100-mt": { presenter: "GROWTHCORP" as const, reference: "GSAM-SCO-PROGRAM-100MT-2026-001", quantityMt: 100, quantityKg: 100000 },
  "gsam-1000-mt": { presenter: "GROWTHCORP" as const, reference: "GSAM-SCO-PROGRAM-1000MT-2026-001", quantityMt: 1000, quantityKg: 1000000 },
} as const;
export type GenericProgramScoVariantKey = keyof typeof genericProgramScoVariants;
export const genericProgramScoSections = [
  { heading: "PRODUCT AND ORIGIN", text: "Gold doré bars of Malian origin, presented through French-Ward, Inc. and its documented commercial relationship with Coopérative de Bafoula. Indicative minimum gold content: 96% Au, subject to final refinery assay and applicable transaction documentation." },
  { heading: "INDICATIVE PURCHASE PRICE", text: "Indicative pricing basis: the applicable LBMA Gold Price less 5%, calculated on final-assay payable gold. Price fixing, reference date, payable-metal calculation, adjustments, and settlement mechanics are to be specified in definitive transaction documentation." },
  { heading: "DELIVERY, ASSAY AND SETTLEMENT", text: "Delivery basis, destination, refinery, export permissions, chain of custody, assay and settlement arrangements will be defined and agreed for the transaction. Any Good-Faith Transaction Assurance Payment is subject to separate agreement and authorization; this SCO contains no payment instructions." },
  { heading: "DOCUMENTARY CONDITIONS", text: "Progression is subject to appropriate commercial qualification, source-side confirmation, agreed tranche particulars, required documentation, and execution of the applicable definitive agreement. A Transaction Overview may accompany this offer if expressly identified and included in the authorized documentary package." },
  { heading: "COMMERCIAL ENGAGEMENT", text: "Interested counterparties may proceed through French-Ward’s authorized commercial representatives to confirm applicable terms, program scheduling, and preparation of definitive transaction documentation. No binding sale or allocation arises from this indicative SCO." },
] as const;
export function getGenericProgramSco(key:string) {
  if (!Object.prototype.hasOwnProperty.call(genericProgramScoVariants,key)) return null;
  return genericProgramScoVariants[key as GenericProgramScoVariantKey];
}
export function programQuantityText(mt:number,kg:number) {
  return `Proposed program volume: ${mt.toLocaleString("en-US")} metric tonnes (${kg.toLocaleString("en-US")} KG). Quantities may be structured into mutually agreed tranches and delivery schedules. Source availability, allocation, export arrangements, and delivery capacity require separate confirmation; the program volume is not a reserved allocation or delivery guarantee.`;
}

/** Representation-led compositions are not independent seller/source authority. */
export const growthcorpProgramScoSections = [
  { heading: "PRODUCT AND ORIGIN", text: "Growthcorp Solutions Asset Management Limited (GSAM) presents this Soft Corporate Offer for Malian gold doré bars under its authorized commercial mandate. Minimum indicative gold content is 96% Au, with payable content determined by final refinery assay and governing transaction documentation." },
  genericProgramScoSections[1],
  { heading: "DELIVERY, ASSAY AND SETTLEMENT", text: "Delivery basis, destination, refinery, export permissions, chain of custody, assay and settlement arrangements are established in the governing transaction documents. Any Good-Faith Transaction Assurance Payment requires separately agreed and authorized terms; this SCO contains no payment instructions." },
  genericProgramScoSections[3],
  { heading: "COMMERCIAL ENGAGEMENT", text: "All commercial correspondence, expressions of interest and transaction coordination relating to this offer shall be directed through Growthcorp Solutions Asset Management Limited, attention James Crawford. Specific allocation and settlement obligations arise only under duly executed transaction documents." },
] as const;
