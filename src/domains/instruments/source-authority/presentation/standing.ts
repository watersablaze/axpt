import type {
  SourceAuthorityPresentationStanding,
  SourceAuthorityRecognitionOutcome,
} from "../contracts";

export type SourceAuthorityStandingRecognition =
  Readonly<{
    outcome:
      SourceAuthorityRecognitionOutcome;
  }>;

export function deriveSourceAuthorityPresentationStanding(
  recognitions:
    readonly SourceAuthorityStandingRecognition[],
): SourceAuthorityPresentationStanding {
  if (recognitions.length === 0) {
    return "UNREVIEWED";
  }

  const hasLimited =
    recognitions.some(
      ({ outcome }) =>
        outcome ===
          "RECOGNIZED_WITH_LIMITATION",
    );

  if (hasLimited) {
    return "LIMITED";
  }

  const recognizedCount =
    recognitions.filter(
      ({ outcome }) =>
        outcome === "RECOGNIZED",
    ).length;

  const notRecognizedCount =
    recognitions.filter(
      ({ outcome }) =>
        outcome === "NOT_RECOGNIZED",
    ).length;

  if (
    recognizedCount ===
      recognitions.length
  ) {
    return "RECOGNIZED";
  }

  if (
    recognizedCount > 0 ||
    notRecognizedCount > 0
  ) {
    return "PARTIALLY_RECOGNIZED";
  }

  return "UNREVIEWED";
}
