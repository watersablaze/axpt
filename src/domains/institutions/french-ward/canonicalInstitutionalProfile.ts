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
      2,

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
      "French-Ward, Inc. undertakes international trade and commercial operations through an integrated practice of custodianship and commercial responsibility, developing source and counterparty relationships while coordinating documented authority, commercial commitments, delivery arrangements, and settlement preparation.",

    orientation:
      "French-Ward brings institutional direction and commercial execution into one governed practice. Its objective is the responsible advancement of commerce through attributable authority, documentary continuity, accountable relationships, and conditions sufficient for performance.",

    custodianshipThesis:
      "Custodianship, commercial responsibility, and the governed passage of wealth.",

    transactionPreparation: [
      "Intake",
      "Review",
      "Qualification",
      "Dossier",
      "Execution",
    ],

    establishedSourceRelationships: [
      "French-Ward's institutional practice includes its established relationship with Coopérative de Bafoula in the Republic of Mali, encompassing source-side commercial engagement, authorized resale activities, and international commercial coordination under the applicable governing instruments.",
      "The relationship reflects French-Ward's integrated approach to custodianship and commercial responsibility, in which stewardship of source relationships, documentary continuity, commercial commitments, and accountable passage forms part of one institutional practice.",
      "The relationship's custodial arrangements, reseller appointment, exclusivity, territorial reach, and specific commercial authorities are established and governed by their respective instruments. This Institutional Profile describes the relationship without independently enlarging or substituting for those authorities.",
    ],

    institutionalDefinition: [
      "French-Ward, Inc. is a Florida corporation engaged in international trade and commercial operations. Its custodial discipline is expressed through the commercial responsibilities it undertakes, including the stewardship of relationships, commitments, records, and the conditions required for accountable passage.",
      "French-Ward's capacity in any particular relationship—including appointed reseller, contracting seller, or custodian—is established by applicable agreements and authority records. Its institutional discipline does not independently confer legal custody or transaction-specific authority.",
      "French-Ward uses AXPT to organize institutional records, controlled access, commercial workflows, and transaction continuity. Digital systems support the institution's work without independently establishing or enlarging its commercial authority.",
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
      "Authority must be attributable to an identifiable source and supported by appropriate records.",
      "Commercial roles, responsibilities, and authority must be documented, with their scope clear.",
      "Statements and commitments must remain within approved terms and established authority.",
      "Evidence must remain current and sufficient for the decision it supports.",
      "Transaction readiness requires alignment between agreed documentation and practical execution conditions.",
      "Delivery and settlement responsibilities must be identified before execution.",
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
