import {
  SOURCE_AUTHORITY_ASSERTION_CLASS,
} from "../contracts";

export const BAFOULA_SOURCE_AUTHORITY_MANIFEST = {
  instrument: {
    reference:
      "BAF-SAI-2026-001",

    title:
      "COOPÉRATIVE DE BAFOULA — SOURCE AUTHORITY INSTRUMENT",
  },

  sourceProfile: {
    documentReference:
      "BAF-PROFILE-MALI-2026-002",

    version:
      "v4 · 2026",

    status:
      "External Reference",

    registrationReference:
      null,

    registrationStanding:
      "PENDING_DOCUMENTARY_COMPLETION",
  },

  subject: {
    displayName:
      "Coopérative de Bafoula",

    jurisdiction:
      "Republic of Mali",

    institutionalCapacity:
      "Malian Cooperative · Source Authority",

    operatingBase:
      "Bamako, Republic of Mali",

    sector:
      "Minerals and Natural Resources",

    principalCommodityActivity: [
      "Gold",
      "Gold Doré",
    ],
  },

  assertions: [
    {
      reference:
        "A001",

      assertionClass:
        SOURCE_AUTHORITY_ASSERTION_CLASS
          .INSTITUTIONAL_IDENTITY,

      title:
        "Institutional Identity",

      statement:
        "The supplied Source Authority Profile identifies Coopérative de Bafoula as a Malian cooperative operating from Bamako, Republic of Mali, within the minerals and natural-resources sector.",

      scope:
        "Source profile assertion derived from BAF-PROFILE-MALI-2026-002; documentary recognition remains pending.",

      ordinal:
        1,
    },

    {
      reference:
        "A002",

      assertionClass:
        SOURCE_AUTHORITY_ASSERTION_CLASS
          .SOURCE_AUTHORITY,

      title:
        "Source-Side Authority",

      statement:
        "The supplied Source Authority Profile states that Coopérative de Bafoula maintains source-side authority over commodity interests and source relationships placed under its control.",

      scope:
        "Source-side institutional assertion only. It does not establish title, allocation, export authorization, transaction authority, or commodity availability.",

      ordinal:
        2,
    },

    {
      reference:
        "A003",

      assertionClass:
        SOURCE_AUTHORITY_ASSERTION_CLASS
          .OPERATIONAL_CAPABILITY,

      title:
        "Operational Scope",

      statement:
        "The supplied Source Authority Profile describes Coopérative de Bafoula as participating in mineral production and aggregation, commodity preparation and source coordination, commercial preparation, export and logistics coordination, counterparty engagement, and documentary and regulatory support.",

      scope:
        "Capability description derived from the supplied Source Authority Profile; capability does not establish current inventory, allocation, title, assay, export readiness, or transaction authority.",

      ordinal:
        3,
    },

    {
      reference:
        "A004",

      assertionClass:
        SOURCE_AUTHORITY_ASSERTION_CLASS
          .COMMERCIAL_RELATIONSHIP,

      title:
        "Authorized International Commercial Channel",

      statement:
        "The supplied Source Authority Profile identifies French-Ward, Inc. as an authorized reseller and international commercial coordination channel for applicable transactions pursuant to governing instruments established with Coopérative de Bafoula.",

      scope:
        "Relationship assertion only. The scope of French-Ward authority remains governed by the applicable underlying instruments and does not arise from this Source Authority Instrument alone.",

      ordinal:
        4,
    },

    {
      reference:
        "A005",

      assertionClass:
        SOURCE_AUTHORITY_ASSERTION_CLASS
          .SOVEREIGN_CONTEXT,

      title:
        "Malian Sovereign and Regulatory Context",

      statement:
        "The supplied Source Authority Profile places Coopérative de Bafoula within the legal, regulatory, and commercial framework of the Republic of Mali.",

      scope:
        "Contextual assertion only. This Source Authority Instrument does not confer sovereign State authority, regulatory approval, licensing, or export authorization.",

      ordinal:
        5,
    },

    {
      reference:
        "A006",

      assertionClass:
        SOURCE_AUTHORITY_ASSERTION_CLASS
          .INSTRUMENT_BOUNDARY,

      title:
        "Source Authority Instrument Boundary",

      statement:
        "Establishment, issuance, or recognition of this Source Authority Instrument does not by itself establish sovereign State authority, regulatory approval, export authorization, commodity availability, commodity allocation, title, transaction authority, or settlement authority.",

      scope:
        "Canonical AXPT Source Authority doctrine. This is an instrument-boundary assertion and not an external factual claim concerning the Cooperative.",

      ordinal:
        6,
    },
  ],

  capabilities: [
    {
      assertionReference:
        "A003",

      capabilityKey:
        "MINERAL_PRODUCTION_AGGREGATION",

      title:
        "Mineral Production & Aggregation",

      description:
        "Coordination of participating producers and mineral supply entering the Cooperative's approved source network.",
    },

    {
      assertionReference:
        "A003",

      capabilityKey:
        "COMMODITY_PREPARATION_SOURCE_COORDINATION",

      title:
        "Commodity Preparation & Source Coordination",

      description:
        "Preparation, aggregation, and source-side coordination of mineral commodities, including gold doré.",
    },

    {
      assertionReference:
        "A003",

      capabilityKey:
        "COMMERCIAL_PREPARATION",

      title:
        "Commercial Preparation",

      description:
        "Preparation of commodity supply for approved domestic and international transactions.",
    },

    {
      assertionReference:
        "A003",

      capabilityKey:
        "EXPORT_LOGISTICS_COORDINATION",

      title:
        "Export & Logistics Coordination",

      description:
        "Coordination of transaction-stage logistics and applicable export processes with authorized parties.",
    },

    {
      assertionReference:
        "A003",

      capabilityKey:
        "COUNTERPARTY_ENGAGEMENT",

      title:
        "Counterparty Engagement",

      description:
        "Engagement with qualified domestic and international buyers, refiners, institutions, and commercial counterparties.",
    },

    {
      assertionReference:
        "A003",

      capabilityKey:
        "DOCUMENTARY_REGULATORY_SUPPORT",

      title:
        "Documentary & Regulatory Support",

      description:
        "Support of transaction-specific documentary, regulatory, source, and compliance requirements.",
    },
  ],
} as const;

export type BafoulaSourceAuthorityManifest =
  typeof BAFOULA_SOURCE_AUTHORITY_MANIFEST;
