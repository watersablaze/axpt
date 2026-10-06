import {
  SOURCE_AUTHORITY_RECOGNITION_OUTCOME,
} from "../contracts";

export const BAFOULA_RECOGNITION_PLAN = {
  instrumentReference:
    "BAF-SAI-2026-001",

  sourceProfileReference:
    "BAF-PROFILE-MALI-2026-002",

  executionAuthorized:
    false,

  items: [
    {
      assertionReference:
        "A001",

      disposition:
        "CANDIDATE_RECOGNITION",

      outcome:
        SOURCE_AUTHORITY_RECOGNITION_OUTCOME
          .RECOGNIZED_WITH_LIMITATION,

      evidenceRequired:
        true,

      limitation:
        "The supplied profile supports the stated institutional identity, while the official cooperative registration reference remains pending documentary completion.",

      operatorDecisionRequired:
        true,
    },

    {
      assertionReference:
        "A002",

      disposition:
        "CANDIDATE_RECOGNITION",

      outcome:
        SOURCE_AUTHORITY_RECOGNITION_OUTCOME
          .RECOGNIZED_WITH_LIMITATION,

      evidenceRequired:
        true,

      limitation:
        "The supplied profile states Bafoula's source-side authority; underlying source, producer, custodial, or comparable authority records may be required for stronger documentary standing.",

      operatorDecisionRequired:
        true,
    },

    {
      assertionReference:
        "A003",

      disposition:
        "CANDIDATE_RECOGNITION",

      outcome:
        SOURCE_AUTHORITY_RECOGNITION_OUTCOME
          .RECOGNIZED_WITH_LIMITATION,

      evidenceRequired:
        true,

      limitation:
        "The supplied profile describes operational scope but does not establish current commodity availability, inventory, allocation, title, assay, export readiness, or transaction authority.",

      operatorDecisionRequired:
        true,
    },

    {
      assertionReference:
        "A004",

      disposition:
        "HOLD_FOR_ADDITIONAL_EVIDENCE",

      outcome:
        null,

      evidenceRequired:
        true,

      limitation:
        "The profile identifies French-Ward, Inc. as an authorized commercial channel but expressly states that its authority derives from governing instruments. The applicable governing authority instrument is required before affirmative recognition of this relationship.",

      operatorDecisionRequired:
        true,
    },

    {
      assertionReference:
        "A005",

      disposition:
        "CANDIDATE_RECOGNITION",

      outcome:
        SOURCE_AUTHORITY_RECOGNITION_OUTCOME
          .RECOGNIZED_WITH_LIMITATION,

      evidenceRequired:
        true,

      limitation:
        "The profile supports contextual placement within the legal and regulatory framework of Mali but does not establish State authority, licensing, regulatory approval, or export authorization.",

      operatorDecisionRequired:
        true,
    },

    {
      assertionReference:
        "A006",

      disposition:
        "INTERNAL_INSTRUMENT_DOCTRINE",

      outcome:
        null,

      evidenceRequired:
        false,

      limitation:
        "A006 is an AXPT instrument-boundary doctrine and is not evidenced by the external Bafoula profile.",

      operatorDecisionRequired:
        false,
    },
  ],
} as const;
