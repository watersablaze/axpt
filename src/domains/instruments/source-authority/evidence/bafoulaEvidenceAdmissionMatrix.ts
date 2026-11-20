export const BAFOULA_SOURCE_PROFILE_EVIDENCE = {
  documentReference:
    "BAF-PROFILE-MALI-2026-002",

  title:
    "Coopérative de Bafoula Source Authority Profile",

  version:
    "v4 · 2026",

  status:
    "External Reference",

  evidenceType:
    "DOCUMENT",

  subjectType:
    "INSTRUMENT",

  assertionAdmission: [
    {
      assertionReference:
        "A001",

      admissible:
        true,

      sufficientForUnqualifiedRecognition:
        false,

      suggestedOutcome:
        "RECOGNIZED_WITH_LIMITATION",

      limitation:
        "The supplied profile supports the stated institutional identity, while the official cooperative registration reference remains pending documentary completion.",
    },

    {
      assertionReference:
        "A002",

      admissible:
        true,

      sufficientForUnqualifiedRecognition:
        false,

      suggestedOutcome:
        "RECOGNIZED_WITH_LIMITATION",

      limitation:
        "The supplied profile states Bafoula's source-side authority; underlying source, producer, custodial, or comparable authority records may be required for stronger documentary standing.",
    },

    {
      assertionReference:
        "A003",

      admissible:
        true,

      sufficientForUnqualifiedRecognition:
        false,

      suggestedOutcome:
        "RECOGNIZED_WITH_LIMITATION",

      limitation:
        "The supplied profile describes operational scope but does not establish current commodity availability, inventory, allocation, title, assay, export readiness, or transaction authority.",
    },

    {
      assertionReference:
        "A004",

      admissible:
        true,

      sufficientForUnqualifiedRecognition:
        false,

      suggestedOutcome:
        null,

      limitation:
        "The profile identifies French-Ward, Inc. as an authorized commercial channel but expressly states that its authority derives from governing instruments. The applicable governing authority instrument is required before affirmative recognition of this relationship.",
    },

    {
      assertionReference:
        "A005",

      admissible:
        true,

      sufficientForUnqualifiedRecognition:
        false,

      suggestedOutcome:
        "RECOGNIZED_WITH_LIMITATION",

      limitation:
        "The profile supports contextual placement within the legal and regulatory framework of Mali but does not establish State authority, licensing, regulatory approval, or export authorization.",
    },

    {
      assertionReference:
        "A006",

      admissible:
        false,

      sufficientForUnqualifiedRecognition:
        false,

      suggestedOutcome:
        null,

      limitation:
        "A006 is an AXPT instrument-boundary doctrine and is not evidenced by the external Bafoula profile.",
    },
  ],
} as const;
