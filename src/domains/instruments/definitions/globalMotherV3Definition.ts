import { INSTRUMENT_PROPOSITION_STATE } from "../contracts";

export const GLOBAL_MOTHER_V2_INSTRUMENT_REFERENCE =
  "GM-KENYA-RCF-001" as const;

/* The issued proposition text must match the eight positions displayed in the register. */
export const globalMotherV3Definition = {
  reference: GLOBAL_MOTHER_V2_INSTRUMENT_REFERENCE,
  version: 3,
  title: "Framework of Royal Custodianship, Restoration & Global Trade",
  subtitle: "An institutional framework for relationship, authority, gold passage, and continuity.",
  propositions: [
    {
      reference: "ALIGN-01",
      domain: "Recognition & Relationship",
      title: "Royal principal",
      body: "ND Royal Ministry is the Royal principal represented by the Global Mother. Its governance and authority remain its own.",
      state: INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 1,
    },
    {
      reference: "ALIGN-02",
      domain: "Recognition & Relationship",
      title: "AOTG bridge & capacity",
      body: "The Global Mother’s trust in Imperial Khan-Khan opens the AOTG bridge to French-Ward. AOTG brings its own custodial standing. The relationship seeks to strengthen AOTG’s governmental capacity and place in global trade.",
      state: INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 2,
    },
    {
      reference: "ALIGN-03",
      domain: "Authority & Custodianship",
      title: "French-Ward custodianship & mandate",
      body: "French-Ward approaches this relationship as an institutional custodian. Its authority in gold trade rests on its operative mandate; its role in this relationship will be shaped with the other parties.",
      state: INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 3,
    },
    {
      reference: "ALIGN-04",
      domain: "Economic Passage",
      title: "Gold passage",
      body: "Gold is the present economic anchor. Its passage calls for verified source and authority, a refinery relationship, receiving capacity, settlement, and accountable return.",
      state: INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 4,
    },
    {
      reference: "ALIGN-05",
      domain: "Restoration & Continuity",
      title: "Productive return",
      body: "The value created through this relationship should strengthen Royal and AOTG capacity, communities, and future work beyond any single transaction.",
      state: INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 5,
    },
    {
      reference: "ALIGN-06",
      domain: "Restoration & Continuity",
      title: "French-Ward’s Gift",
      body: "French-Ward intends a two-part Gift for AOTG and ND Royal Ministry: (1) a digital tokenization pathway; (2) a digital media management, design, and development package. The recipients will help shape each part.",
      state: INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 6,
    },
    {
      reference: "ALIGN-07",
      domain: "Deliberation & Instrument Formation",
      title: "Master agreement pathway",
      body: "Recorded responses will show where the parties align and what needs further work. That record will guide a proposed master agreement among AOTG, French-Ward, and ND Royal Ministry.",
      state: INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 7,
    },
    {
      reference: "ALIGN-08",
      domain: "Deliberation & Instrument Formation",
      title: "Mutual Respect & Considered Action",
      body: "Within the proposed institutional partnership, French-Ward, AOTG, and ND Royal Ministry intend to uphold mutual respect, clear communication, and considered action—even amid urgency, disagreement, or unforeseen disruption.\n\nParticipants will seek clarification before drawing conclusions, communicate changes in availability or timing as promptly as circumstances allow, and address concerns directly and courteously. Decisions will account for readiness, responsibilities, and conditions on the ground.\n\nOur shared commitment to restoration calls for both resolve and care: respect for one another, and respect for the work being built.",
      state: INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 8,
    },
  ],
} as const;
