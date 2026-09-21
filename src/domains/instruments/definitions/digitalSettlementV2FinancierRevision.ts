import {
  DSI_APPROVED_ISSUANCE_PRICING,
  DSI_REFERENCE,
  INDERAKSH_LEGAL_NAME,
} from "./digitalSettlementV1Definition";

export const DSI_V2_VERSION = 2 as const;

export const DSI_V2_FINANCIER_REVISION = {
  reference: DSI_REFERENCE,
  version: DSI_V2_VERSION,
  supersedesVersion: 1,
  counterparty: INDERAKSH_LEGAL_NAME,
  revisionTitle: "Buyer-Informed TAP Financier Revision",
  revisionBasis:
    "The Buyer group clarified after V1 issuance that Carl Albert Meisterlin is the appointed financier for the Good-Faith Transaction Authorization Payment (TAP).",
  preservationBoundary:
    "V2 revises participant capacity, private-access routing, and communication responsibility only. It does not alter the Buyer, commercial pricing, transaction quantity, French-Ward Operations receiving wallet, settlement rail, 50 USDT verification requirement, remaining TAP amount, or operator-controlled recognition and authorization boundaries.",
  buyerRepresentative: {
    name: "Corey Keller",
    title: "Vice President",
    email: "corey@inderakshgold.com",
    recordedCapacity: "Authorized Buyer Representative",
    v2Capacity: "Buyer Representative / Review Participant",
  },
  tapFinancier: {
    name: "Carl Albert Meisterlin",
    email: "meisterlin@aol.com",
    loiCapacity: "Seller Consultant",
    v2Capacity: "Buyer-Appointed TAP Financier / Active DSI Participant",
    appointmentSource:
      "Buyer-group clarification received after V1 issuance; this role is not stated in the signed LOI.",
  },
  externalReviewer: {
    name: "Dr. Don C. Hinds",
    email: "DHinds@ibosed.com",
    loiCapacity: "Seller Consultant",
    v2Capacity: "External Transaction Participant / Review Participant",
  },
  internalReviewers: [
    {
      name: "Bobby",
      email: "frenchward938@gmail.com",
      v2Capacity: "French-Ward Internal Operations / Review Participant",
    },
    {
      name: "Lawrence",
      email: "lrwjr1@me.com",
      v2Capacity: "French-Ward Fiduciary Counsel / Review Participant",
    },
  ],
  activeAction: {
    participant: "Carl Albert Meisterlin",
    authorizedAmountUsdt: "50",
    purpose: "Verification transfer only",
    remainingTapUsdt: "471762.40",
    remainingTapAuthority: "NOT AUTHORIZED",
  },
  commercialSnapshot: DSI_APPROVED_ISSUANCE_PRICING,
  axptPosition:
    "AXPT is the governance and transaction-state infrastructure through which French-Ward issues, versions, secures, observes, and records this instruction. AXPT is not the Buyer, the appointed financier, or the sender of funds, and it does not autonomously recognize a transfer or authorize the TAP balance.",
  observerPosition:
    "AXPT's supervised blockchain observer may detect and preserve canonical Ethereum USDT evidence. Observation does not equal verification or recognition; an authorized French-Ward operator must separately recognize qualifying evidence before the instrument may advance.",
} as const;

export type DigitalSettlementV2RecipientKey =
  | "financier"
  | "buyerRepresentative"
  | "externalReviewer"
  | "bobby"
  | "lawrence";

export const DIGITAL_SETTLEMENT_V2_RECIPIENTS = {
  financier: {
    ...DSI_V2_FINANCIER_REVISION.tapFinancier,
    accessPurpose: "ACTIVE_RESPONSE",
  },
  buyerRepresentative: {
    ...DSI_V2_FINANCIER_REVISION.buyerRepresentative,
    accessPurpose: "REVIEW",
  },
  externalReviewer: {
    ...DSI_V2_FINANCIER_REVISION.externalReviewer,
    accessPurpose: "REVIEW",
  },
  bobby: {
    ...DSI_V2_FINANCIER_REVISION.internalReviewers[0],
    accessPurpose: "INTERNAL_REVIEW",
  },
  lawrence: {
    ...DSI_V2_FINANCIER_REVISION.internalReviewers[1],
    accessPurpose: "FIDUCIARY_REVIEW",
  },
} as const;
