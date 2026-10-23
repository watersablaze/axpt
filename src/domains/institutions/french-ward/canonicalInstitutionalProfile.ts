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

    corporateCoordinates: {
      registrationJurisdiction: "Florida, United States",
      registrationNumber: "P24000056039",
      corporateStatus: "Active",
      principalAddress: "4701 Old Canoe Creek Road #700641, St. Cloud, FL 34769, USA",
      telephone: "+1 518 381 0306",
    },

    commercialActivities: [
      "Commercial Precious Metals Trading",
      "Authorized Commodity Resale",
      "Commercial Transaction Administration",
      "Settlement Coordination",
    ],

    classification:
      "International Trade & Commercial Operations",

    publicDescription:
      "French-Ward connects trusted source relationships with international commerce through custodianship, accountable commitments, and coordinated delivery and settlement.",

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
      "French-Ward's institutional practice includes its established relationship with Coopérative de Bafoula in the Republic of Mali, encompassing source-side commercial engagement, authorized resale activities, and international commercial coordination under the applicable governing instruments. French-Ward is appointed as the worldwide exclusive reseller channel for Coopérative de Bafoula under the applicable governing instruments.",
      "The relationship is anchored in a Declaration of Trust & Custodianship, reflecting the confidence placed in French-Ward to steward the commercial passage of the cooperative’s assets. It brings custodianship and commercial responsibility together: respect for the source, continuity of records, and care in the commitments made on its behalf. This foundation supports a considered opening to wider global trade through accountable counterparties and arrangements that honor the cooperative’s interests.",
      "The Declaration of Trust & Custodianship and the exclusive reseller mandate give documentary expression to this relationship, setting out custodial responsibilities, international commercial reach, and the terms through which French-Ward represents the cooperative’s source interests.",
    ],

    institutionalDefinition: [
      "French-Ward, Inc. is a Florida corporation engaged in international trade and commercial operations. Its custodial practice includes responsibility for commercial relationships, commitments, records, and the conditions of performance.",
      "French-Ward works as an appointed reseller, contracting seller, or custodian according to the needs and agreements of each relationship, bringing clear responsibilities and continuity to the passage from source engagement to performance.",
      "French-Ward uses AXPT to connect its records, secure correspondence, commercial workflows, and transaction history, giving counterparties a consistent place to engage and follow their work.",
    ],

    // FW-PROFILE-5A: Identity disclosures, not grants of operative authority.
    leadership: [
      {
        name: "Jamal Ward",
        title: "Chief Strategic Officer",
        responsibility: "Provides institutional leadership, strategic direction, and oversight of French-Ward's commercial relationships and organizational priorities.",
      },
      {
        name: "Bobby French",
        title: "Chief Logistics Officer",
        responsibility: "Directs logistical planning, operational coordination, security considerations, and delivery-readiness arrangements supporting accountable execution.",
      },
      {
        name: "Lawrence R. Williams",
        title: "Chief Fiduciary & Authorized Escrow Attorney",
        responsibility: "Oversees fiduciary considerations, authorized escrow responsibilities, documentary safeguards, and legal coordination within the scope of applicable engagements and instruments.",
      },
    ],

    counterpartyEngagement: [
      "Buyers, refineries, suppliers, financiers, and institutional partners may contact French-Ward through its designated commercial intake or authenticated correspondence channel to discuss a proposed engagement.",
      "French-Ward reviews each proposed relationship and its requirements, then confirms the appropriate next steps directly with the counterparty.",
      "Qualification identifies the corporate, compliance, transaction, and delivery information required for the proposed relationship and relevant jurisdictions.",
    ],

    counterpartyDueDiligence:
      "Commercial engagement is subject to appropriate counterparty identification, qualification, and transaction-specific review. Depending on the proposed relationship and applicable requirements, French-Ward may request corporate registration records, beneficial-ownership and authorized-signatory information, relevant licenses, source and material documentation, evidence of financial capacity, and supporting compliance records. Documentation is reviewed in relation to the proposed transaction, the applicable jurisdiction, and the responsibilities of the participating parties. French-Ward confirms readiness and the agreed next steps once the relevant review is complete.",

    documentaryReadiness: [
      "Following qualification and applicable authorization, French-Ward coordinates the source-authority, commercial, logistics, and settlement documentation required for the proposed transaction.",
      "Applicable appointments and custodial instruments, along with agreed quantities, pricing, delivery obligations, and settlement instructions, are established in the relevant instruments and transaction agreements.",
      "Before execution, the parties confirm identity and corporate verification, applicable compliance requirements, sufficient documentation, delivery arrangements, and authenticated settlement instructions.",
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
