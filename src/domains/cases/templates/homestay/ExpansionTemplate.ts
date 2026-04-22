export const HOMESTAY_EXPANSION_TEMPLATE = {
  name: "Township Homestay Expansion",

  workflowType: "FUNDING",

  roles: [
    "OWNER",
    "FUNDER",
    "VERIFIER",
    "ARCHITECT",
    "COMMUNITY_REVIEWER"
  ],

  gates: [
    {
      name: "Project Proposal Submitted",
      order: 1
    },

    {
      name: "Community Review",
      order: 2
    },

    {
      name: "Architectural Plan Approved",
      order: 3
    },

    {
      name: "Funding Escrow Locked",
      order: 4
    },

    {
      name: "Construction Phase Verified",
      order: 5
    },

    {
      name: "Guest Facilities Completed",
      order: 6
    },

    {
      name: "Funding Released",
      order: 7
    }
  ]
}