import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_PARTY_ROLE,
  INSTRUMENT_PROPOSITION_STATE,
  INSTRUMENT_VERSION_STATUS,
} from "../contracts";

export const GREAT_MOTHER_INSTRUMENT_REFERENCE =
  "GM-KENYA-RCF-001" as const;

export const greatMotherV1Definition = {
  instrument: {
    reference: GREAT_MOTHER_INSTRUMENT_REFERENCE,
    kind: INSTITUTIONAL_INSTRUMENT_KIND.ROYAL_CUSTODIAL_FRAMEWORK,
    title: "Framework of Royal Custodianship",
    status: INSTITUTIONAL_INSTRUMENT_STATUS.UNDER_DELIBERATION,
    currentVersion: 1,
  },

  version: {
    number: 1,
    status: INSTRUMENT_VERSION_STATUS.ISSUED,
  },

  parties: [
    {
      displayName: "French-Ward",
      role: INSTRUMENT_PARTY_ROLE.CUSTODIAN,
    },
  ],

  propositions: [
    {
      reference: "REL-01",
      domain: "Relationship",
      title: "Royal standing",
      body:
        "The Great Mother’s Royal standing has been sufficiently established for the relationship to proceed in good faith.",
      state: INSTRUMENT_PROPOSITION_STATE.CONFIRMED,
      ordinal: 1,
    },
    {
      reference: "REL-02",
      domain: "Relationship",
      title: "Relational economic opening",
      body:
        "The invitation is understood to join family relationship, lawful trade, restoration, projects and continuing return.",
      state: INSTRUMENT_PROPOSITION_STATE.UNDERSTOOD,
      ordinal: 2,
    },
    {
      reference: "AUTH-01",
      domain: "Authority",
      title: "French-Ward custodianship",
      body:
        "French-Ward is proposed as a custodial institutional partner operating through expressly defined delegated authority.",
      state: INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 3,
    },
    {
      reference: "AUTH-02",
      domain: "Authority",
      title: "Reserved Royal authority",
      body:
        "Royal identity, recognition, symbols, appointments and final Royal representation remain under Royal authority unless expressly delegated.",
      state: INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 4,
    },
    {
      reference: "PASS-01",
      domain: "Economic Corridor",
      title: "Governed passage",
      body:
        "Gold should progress only through an identified source, verified authority, controlled passage, qualified receiving gateway, assay and settlement.",
      state: INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 5,
    },
    {
      reference: "PASS-02",
      domain: "Economic Corridor",
      title: "Three-kilogram provision",
      body:
        "The legal and economic character of the proposed three-kilogram / approximately USD 300,000 provision remains to be defined.",
      state: INSTRUMENT_PROPOSITION_STATE.OPEN,
      ordinal: 6,
    },
    {
      reference: "FUT-01",
      domain: "Future Body",
      title: "Royal Digital House",
      body:
        "French-Ward proposes the Royal Digital House as an inaugural institutional gift for heritage, identity, projects, governance and future digital-economic development.",
      state: INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 7,
    },
    {
      reference: "FUT-02",
      domain: "Future Body",
      title: "Annual return and homage",
      body:
        "The principle of annual return is recognized while its ceremonial, project, service and economic dimensions remain to be jointly defined.",
      state: INSTRUMENT_PROPOSITION_STATE.OPEN,
      ordinal: 8,
    },
  ],
} as const;
