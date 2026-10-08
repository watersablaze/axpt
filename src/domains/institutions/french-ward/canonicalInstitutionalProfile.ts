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
      "International Trade & Commercial Operations",

    publicDescription:
      "French-Ward, Inc. develops and conducts international commercial relationships, bringing source engagement, transaction documentation, delivery coordination, and settlement preparation into a governed process.",

    orientation:
      "French-Ward works to turn commercial opportunities into executable transactions through clear responsibilities, documented authority, agreed terms, and coordinated performance.",

    institutionalDefinition: [
      "French-Ward, Inc. is a Florida corporation engaged in international trade and commercial operations. Its work connects source relationships and counterparties with the documentation, decisions, and practical arrangements required to advance a transaction.",

      "French-Ward’s capacity in a particular relationship—including appointed reseller, contracting seller, or custodian—is established by the applicable agreements and authority records. Those records define the scope and conditions of its role.",

      "French-Ward uses AXPT to organize institutional records, controlled access, commercial workflows, and transaction continuity.",
    ],

    domains: [
      "International Trade",
      "Commodity Commerce",
      "Source Relationships",
      "Commercial Governance",
      "Transaction Execution",
    ],

    practiceAreas: [
      "Establishing source and counterparty relationships",
      "Preparing and maintaining commercial documentation",
      "Assessing transaction readiness and outstanding requirements",
      "Coordinating delivery and cross-border arrangements",
      "Preparing settlement instructions and coordinating performance",
    ],

    operatingPrinciples: [
      "Authority must be attributable.",
      "Commercial roles and authority must be documented.",
      "Statements and commitments must remain within approved terms and authority.",
      "Evidence must be current and sufficient for the decision it supports.",
      "Transaction readiness requires alignment between documentation and practical execution conditions.",
      "Delivery and settlement responsibilities must be clear before execution.",
    ],

    operatingContinuum: [
      "Source Engagement",
      "Authority",
      "Commercial Terms",
      "Documentation",
      "Delivery & Passage",
      "Settlement",
    ],
  };

assertFrenchWardInstitutionalProfile(
  FRENCH_WARD_INSTITUTIONAL_PROFILE,
);
