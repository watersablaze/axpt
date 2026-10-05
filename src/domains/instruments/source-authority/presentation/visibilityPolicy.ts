import type {
  SourceAuthorityAssertionClass,
} from "../contracts";

import type {
  SourceAuthorityPresentationAudience,
} from "./contracts";

/**
 * Presentation visibility is policy, not authority.
 *
 * Hiding or revealing an assertion does not alter the underlying
 * Source Authority Instrument, its evidence, or its recognition state.
 */

export type SourceAuthorityPresentationVisibilityInput =
  Readonly<{
    audience:
      SourceAuthorityPresentationAudience;

    assertionReference:
      string;

    assertionClass:
      SourceAuthorityAssertionClass;
  }>;

/**
 * Instrument-boundary assertions are internal governance material.
 *
 * External surfaces still receive the permanent presentation boundary
 * object, but do not receive the internal INSTRUMENT_BOUNDARY
 * assertion itself.
 *
 * Visibility is governed by assertion semantics rather than by one
 * instrument-specific assertion reference.
 */
export function isSourceAuthorityAssertionVisible(
  input:
    SourceAuthorityPresentationVisibilityInput,
): boolean {
  if (input.audience === "OPERATOR") {
    return true;
  }

  if (
    input.assertionClass ===
      "INSTRUMENT_BOUNDARY"
  ) {
    return false;
  }

  return true;
}

export function isSourceAuthorityEvidenceVisible({
  audience,
}: Readonly<{
  audience:
    SourceAuthorityPresentationAudience;
}>): boolean {
  /**
   * SAI-4B.3 establishes the first projection policy:
   * admitted evidence references are presentable to all three
   * audiences.
   *
   * Raw evidence bytes, document access, and release controls are
   * deliberately outside this derivation policy.
   */
  return (
    audience === "OPERATOR" ||
    audience === "RECIPIENT" ||
    audience === "REPRESENTATIVE"
  );
}

export function isSourceAuthorityOperatorHistoryVisible(
  audience:
    SourceAuthorityPresentationAudience,
): boolean {
  return audience === "OPERATOR";
}
