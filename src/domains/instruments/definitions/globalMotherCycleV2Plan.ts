export const globalMotherCycleV2Plan = {
  cycleLabel: "Chamber V2",
  instrumentReference: "GM-KENYA-RCF-001",
  storageVersion: 5,
  standing: "PREPARATION",
  issuanceEnabled: false,
  deliveryEnabled: false,
  participants: [
    {
      key: "KHAN_KHAN",
      name: "His Imperial Majesty Khan-Khan · Michael Paul Brown · Utcha Net Hotep-El",
      institution: "Ahma Olmec Tartarian Government (AOTG)",
      capacity: "His Imperial Majesty Khan-Khan",
      participation: "DELIBERATOR",
      delivery: "DIRECT",
    },
    {
      key: "GLOBAL_MOTHER",
      name: "Nubian Empress Omaedro II · Dr. Awulah Naanii Amon",
      institution: "ND Royal Ministry",
      capacity: "Global Mother · Nubian Empress · Royal Council Representative",
      participation: "DELIBERATOR",
      delivery: "FRIENDS_OF_FARMERS",
    },
    {
      key: "FRENCH_WARD",
      name: "Chief Jamarú Wata Falkhan · Jamal James Ward",
      institution: "French-Ward, Inc.",
      capacity: "Chief Strategic Officer",
      participation: "DELIBERATOR",
      delivery: "INTERNAL",
    },
  ],
  excludedFromNewCycle: [
    {
      key: "NAMA_CHANCELLOR",
      reason:
        "Historical V1 participation remains preserved; no Chamber V2 grant is planned.",
    },
  ],
  deliveryIntermediaries: [
    {
      name: "Friends of Farmers",
      forParticipant: "GLOBAL_MOTHER",
      authority: "DELIVERY_ONLY",
      note:
        "Delivery and communication channel only. No deliberative standing is inferred.",
    },
  ],
} as const;
