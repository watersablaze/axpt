import { assertCommercialUtilityPackCompositionDescriptor, type CommercialUtilityPackCompositionDescriptor } from "./contracts";
import type { CommercialPaper } from "../commercial-papers/catalog";
/** Candidate identity only; this adapter does not add papers to the default composition plan. */
export function adaptFrenchWardCommercialPaperComposition(paper: CommercialPaper): CommercialUtilityPackCompositionDescriptor {
  const descriptor: CommercialUtilityPackCompositionDescriptor = {
    module: "DOCUMENTS", resourceType: "STRUCTURED_CONTENT", sourceKind: "STRUCTURED_PROJECTION",
    projectionKey: paper.key === "TRANSACTION_OVERVIEW" ? "FRENCH_WARD_TRANSACTION_OVERVIEW" : "FRENCH_WARD_STANDING_SCO",
    sourceId: paper.reference, sourceReference: paper.reference, label: paper.title,
  };
  assertCommercialUtilityPackCompositionDescriptor(descriptor);
  return descriptor;
}
