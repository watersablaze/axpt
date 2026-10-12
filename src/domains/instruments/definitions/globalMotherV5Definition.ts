import { INSTRUMENT_PROPOSITION_STATE } from "../contracts";
import { GLOBAL_MOTHER_INSTRUMENT_REFERENCE } from "./globalMotherV4Definition";

/*
 * V5 is the draft foundation for Chamber V2.
 *
 * Human deliberative cycle:
 *   Chamber V1 -> Intermission -> Chamber V2
 *
 * Institutional storage lineage:
 *   V4 (issued / historical) -> V5 (draft)
 *
 * V5 deliberately separates foundational relationship and authority
 * from refinery- and transaction-specific mechanics.
 */
export const globalMotherV5Definition = {
  reference: GLOBAL_MOTHER_INSTRUMENT_REFERENCE,
  version: 5,

  title:
    "Framework of Royal Custodianship, Restoration & Global Trade",

  subtitle:
    "A matured institutional framework for relationship, authority, governed gold passage, restoration, and considered formation.",

  cycleLabel: "Chamber V2",

  propositions: [
    {
      reference: "ALIGN-01",
      domain: "Recognition & Relationship",
      title: "Royal principal & protected deliberation",
      body:
        "ND Royal Ministry is the Royal principal represented by the Global Mother. Its governance and authority remain its own. The Chamber is a private deliberative environment for collective review, clarification, refinement, and alignment; participation in the Chamber does not itself transfer sovereignty, create commercial authority, or establish a definitive transaction obligation.",
      state: INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 1,
    },

    {
      reference: "ALIGN-02",
      domain: "Recognition & Relationship",
      title: "AOTG bridge, standing & shared purpose",
      body:
        "The Global Mother’s relationship with Imperial Khan-Khan opens the Ahma Olmec Tartarian Government (AOTG) bridge to French-Ward. AOTG enters with its own governmental and custodial standing. The relationship seeks to strengthen institutional capacity, responsible participation in global trade, and the empowerment, support, restoration, and productive continuity of the global Indigenous and Melanated family and community. The bridge establishes relationship; any operative authority remains separately defined.",
      state: INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 2,
    },

    {
      reference: "ALIGN-03",
      domain: "Authority & Custodianship",
      title: "French-Ward custodianship, mandate & commercial role",
      body:
        "French-Ward, Inc. enters as an institutional custodian and strategic commercial participant, bringing its authorized custodial mandate for precious African minerals, source relationships, documentary governance, trade coordination, and institutional capacity into the shared field. Chief Jamarú Wata Falkhan · Jamal James Ward serves French-Ward as Chief Strategic Officer and supports AOTG in a Treasury Consultant capacity. These roles remain distinct and do not merge the authority of the participating institutions.",
      state: INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 3,
    },

    {
      reference: "ALIGN-04",
      domain: "Governed Gold Passage",
      title: "Gold passage & refinery readiness",
      body:
        "Gold is the present economic anchor. Responsible passage requires verified source and authority, documentary readiness, lawful export and logistics, receiving capacity, a credible refinery relationship, assay and acceptance procedures, settlement capacity, accountable return, and movement only when required conditions converge. The contemplated refinery need not be European; suitability is determined by capability, jurisdiction, accessibility, diligence, and the requirements of the specific transaction.",
      state: INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 4,
    },

    {
      reference: "ALIGN-05",
      domain: "Governed Gold Passage",
      title: "Framework / transaction-layer boundary",
      body:
        "This Framework does not appoint a refinery, transfer title to gold, create payment liability, fix assay standards or refinery fees, establish custody or release instructions, or authorize settlement for a specific shipment. Those matters belong in later definitive transaction instruments after the relevant refinery, parties, authorities, quantities, jurisdictions, commercial terms, and operating conditions are identified and accepted.",
      state: INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 5,
    },

    {
      reference: "ALIGN-06",
      domain: "Restoration & Continuity",
      title: "Productive return & continuing contribution",
      body:
        "Value created through the relationship should strengthen ND Royal Ministry, AOTG governmental capacity, communities, restoration, and continuing work beyond any single gold transaction. French-Ward also intends a two-part contribution for AOTG and ND Royal Ministry: a digital tokenization pathway and a digital media management, design, and development package, each to be shaped with the intended recipients rather than imposed in advance.",
      state: INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 6,
    },

    {
      reference: "ALIGN-07",
      domain: "Deliberation & Instrument Formation",
      title: "Formation pathway",
      body:
        "Recorded Chamber responses establish where the participating institutions align and what requires additional work. Sufficient foundational alignment may open preparation of a proposed Master Agreement & Proclamation of Trust among AOTG, French-Ward, Inc., and ND Royal Ministry. Transaction-specific refinery, custody, assay, payment, settlement, title, and release terms may then be developed in the appropriate definitive instruments. Framework alignment alone creates no binding commercial authority.",
      state: INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 7,
    },

    {
      reference: "ALIGN-08",
      domain: "Deliberation & Instrument Formation",
      title: "Mutual respect, clarification & considered action",
      body:
        "Within the proposed institutional relationship, French-Ward, AOTG, and ND Royal Ministry intend to uphold mutual respect, clear communication, clarification before conclusion, and considered action even amid urgency, disagreement, or unforeseen disruption. Material changes in availability, readiness, authority, or timing should be communicated as promptly as circumstances allow, and concerns should be addressed directly and courteously. Relationship establishes the field. Authority establishes the perimeter. Deliberation establishes alignment. Agreement establishes the undertaking. Conditions determine movement.",
      state: INSTRUMENT_PROPOSITION_STATE.PROPOSED,
      ordinal: 8,
    },
  ],
} as const;
