import {
  FRENCH_WARD_INSTITUTIONAL_PROFILE_STATUS,
  assertFrenchWardInstitutionalProfile,
  type FrenchWardInstitutionalProfile,
} from "./contracts";

/**
 * Canonical French-Ward institutional identity.
 *
 * This record establishes stable institutional profile language.
 *
 * It is not:
 * - a Digital Instrument;
 * - a commercial mandate;
 * - a source-authority record;
 * - a transaction record;
 * - a representative appointment;
 * - delegated authority.
 *
 * Relationship-specific and transaction-specific truth remains in
 * its corresponding governed domain.
 */
export const FRENCH_WARD_INSTITUTIONAL_PROFILE:
  FrenchWardInstitutionalProfile = {
    reference:
      "FW-PROFILE-2026-001",

    version:
      1,

    status:
      FRENCH_WARD_INSTITUTIONAL_PROFILE_STATUS
        .CURRENT,

    legalName:
      "French-Ward, Inc.",

    displayName:
      "French-Ward",

    classification:
      "Trade, Authority & Passage",

    publicDescription:
      "French-Ward coordinates source-side relationships, commercial documentation, institutional readiness, and responsible cross-border trade.",

    orientation:
      "French-Ward studies and coordinates the conditions that allow high-value trade to move with attributable authority, documentary continuity, lawful passage, and settlement integrity.",

    institutionalDefinition: [
      "French-Ward operates where source authority, commercial passage, documentary governance, and field intelligence meet.",

      "Within AXPT, French-Ward grounds institutional architecture in real trade corridors, counterparties, evidence, and execution conditions.",
    ],

    domains: [
      "Trade",
      "Commodity Architecture",
      "Source-Side Coordination",
      "Institutional Readiness",
      "Settlement & Passage",
    ],

    practiceAreas: [
      "Source & Authority",
      "Commercial Documentation",
      "Transaction Readiness",
      "Delivery & Passage",
      "Settlement Coordination",
    ],

    operatingPrinciples: [
      "Authority must be attributable.",
      "Evidence must remain current.",
      "Movement requires more than possession.",
      "Settlement requires more than access to a rail.",
    ],

    operatingContinuum: [
      "Source",
      "Authority",
      "Custodianship",
      "Documentation",
      "Passage",
      "Settlement",
    ],
  };

assertFrenchWardInstitutionalProfile(
  FRENCH_WARD_INSTITUTIONAL_PROFILE,
);
