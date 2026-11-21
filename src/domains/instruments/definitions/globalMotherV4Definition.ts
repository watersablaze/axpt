import { INSTRUMENT_PROPOSITION_STATE } from "../contracts";

export const GLOBAL_MOTHER_INSTRUMENT_REFERENCE =
  "GM-KENYA-RCF-001" as const;

/*
 * V4 sharpens the Framework as an institutional Axis Point:
 * relationship → authority → alignment → trust formation →
 * operative conditions → governed action.
 */
export const globalMotherV4Definition = {
  reference: GLOBAL_MOTHER_INSTRUMENT_REFERENCE,
  version: 4,

  title:
    "Framework of Royal Custodianship, Restoration & Global Trade",

  subtitle:
    "An institutional Axis Point for relationship, authority, gold passage, trust formation, and coordinated action.",

  propositions: [
    {
      reference: "ALIGN-01",
      domain: "Recognition & Relationship",
      title: "Royal principal",
      body:
        "ND Royal Ministry is the Royal principal represented by the Global Mother. Its governance and authority remain its own.",
      state:
        INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 1,
    },

    {
      reference: "ALIGN-02",
      domain: "Recognition & Relationship",
      title: "AOTG bridge, capacity & restorative purpose",
      body:
        "The Global Mother’s trust in Imperial Khan-Khan opens the Ahma Olmec Tartarian Government (AOTG) bridge to French-Ward. AOTG brings its own custodial standing. The relationship seeks to strengthen AOTG’s governmental capacity and place in global trade while advancing the empowerment, support, restoration, and productive continuity of the global Indigenous and Melanated family and community.",
      state:
        INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 2,
    },

    {
      reference: "ALIGN-03",
      domain: "Authority & Custodianship",
      title: "French-Ward custodianship, Treasury relationship & mandate",
      body:
        "French-Ward enters this relationship as an institutional custodian and strategic partner, bringing its gold-trade mandate, commercial coordination, and institutional capacity into a shared field of development. Chief Jamarú Wata Falkhan · Jamal James Ward serves French-Ward as Chief Strategic Officer and also supports the Ahma Olmec Tartarian Government (AOTG) in a Treasury Consultant capacity, contributing to treasury coordination and institutional alignment.",
      state:
        INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 3,
    },

    {
      reference: "ALIGN-04",
      domain: "Economic Passage",
      title: "Gold passage",
      body:
        "Gold is the present economic anchor. Its passage calls for verified source and authority, a refinery relationship, receiving capacity, settlement, accountable return, and movement only when the required conditions converge.",
      state:
        INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 4,
    },

    {
      reference: "ALIGN-05",
      domain: "Restoration & Continuity",
      title: "Productive return",
      body:
        "The value created through this relationship should strengthen ND Royal Ministry, AOTG governmental capacity, communities, restoration, and continuing work beyond any single transaction.",
      state:
        INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 5,
    },

    {
      reference: "ALIGN-06",
      domain: "Restoration & Continuity",
      title: "French-Ward’s Gift",
      body:
        "French-Ward intends a two-part Gift for the Ahma Olmec Tartarian Government (AOTG) and ND Royal Ministry: (1) a digital tokenization pathway; (2) a digital media management, design, and development package. The recipients will help shape each part.",
      state:
        INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 6,
    },

    {
      reference: "ALIGN-07",
      domain: "Deliberation & Instrument Formation",
      title: "Master Agreement & Proclamation of Trust pathway",
      body:
        "Recorded responses will show where the parties align and what requires further work. Sufficient alignment may open preparation of the proposed Master Agreement & Proclamation of Trust among the Ahma Olmec Tartarian Government (AOTG), French-Ward, and ND Royal Ministry—a living trust instrument defining the relationship, custodial responsibilities, institutional duties, and any agreed operating structure. Framework alignment alone does not create binding authority.",
      state:
        INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 7,
    },

    {
      reference: "ALIGN-08",
      domain: "Deliberation & Instrument Formation",
      title: "Mutual Respect, Clear Conditions & Considered Action",
      body:
        "Within the proposed institutional relationship, French-Ward, the Ahma Olmec Tartarian Government (AOTG), and ND Royal Ministry intend to uphold mutual respect, clear communication, and considered action—even amid urgency, disagreement, or unforeseen disruption.\n\nParticipants will seek clarification before drawing conclusions, communicate material changes in availability, readiness, or timing as promptly as circumstances allow, and address concerns directly and courteously. Decisions will account for authority, readiness, responsibilities, evidence, and conditions on the ground.\n\nRelationship establishes the field. Authority establishes the perimeter. Deliberation establishes alignment. Agreement establishes the undertaking. Conditions determine movement.",
      state:
        INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 8,
    },
  ],
} as const;
