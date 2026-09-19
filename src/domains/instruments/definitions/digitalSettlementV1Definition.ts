import {
  DIGITAL_SETTLEMENT_ASSET,
  DIGITAL_SETTLEMENT_NETWORK,
  DIGITAL_SETTLEMENT_PRICING_STATUS,
  DIGITAL_SETTLEMENT_STATUS,
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_PARTY_ROLE,
  INSTRUMENT_VERSION_STATUS,
} from "../contracts";

export const DSI_REFERENCE = "FW-DSI-2026-001" as const;
export const DSI_PUBLIC_ID = "fw-dsi-2026-001" as const;
export const INDERAKSH_LEGAL_NAME = "Inderaksh Gold Refinery FZ-LLC" as const;
export const INDERAKSH_REPRESENTATIVE = "Corey Keller, Vice President" as const;

export const DSI_APPROVED_ISSUANCE_PRICING = {
  spotBenchmark:
    "LBMA Gold Price PM · 2026-09-17 · USD 4,368.10 per troy ounce",
  spotPricePerKgUsd: "140437.68",
  pricePerKgUsd: "126393.91",
  transactionValueUsd: "6319695.50",
  settlementAmountUsd: "473977.16",
} as const;

export const INDERAKSH_BUYER_SUBMISSION = {
  documentTitle: "Signed Letter of Intent & Transaction Intake",
  submittedAt: new Date("2026-09-17T00:00:00.000Z"),
  authorityScope:
    "Authorized to represent the buyer for preliminary transaction intake",
  transactionProfile:
    "50 KG trial · 96%+ Gold Doré · CIF / seller-coordinated delivery · Dubai · final settlement following refinery assay",
  recordsOnFile:
    "Signed intake, Dubai Development Authority commercial license, and representative identification",
  evidenceBoundary:
    "The buyer submission supports counterparty identity, representative capacity, and the proposed transaction profile. It does not itself establish the LBMA pricing calculation, 7.5% Good-Faith Transaction Authorization Payment (TAP), USDT rail, or transfer sequence; those terms are established separately by this French-Ward instruction and supplemental commercial direction.",
} as const;

export function createDigitalSettlementV1Definition(
  counterpartyLegalName: string,
) {
  const legalName = counterpartyLegalName.trim();

  if (!legalName) {
    throw new Error("[DSI_COUNTERPARTY_LEGAL_NAME_REQUIRED]");
  }

  return {
    instrument: {
      reference: DSI_REFERENCE,
      kind: INSTITUTIONAL_INSTRUMENT_KIND.DIGITAL_SETTLEMENT_INSTRUCTION,
      title: "Digital Settlement Instruction",
      status: INSTITUTIONAL_INSTRUMENT_STATUS.DRAFT,
      currentVersion: 1,
    },
    version: {
      number: 1,
      status: INSTRUMENT_VERSION_STATUS.DRAFT,
    },
    parties: [
      {
        displayName: "French-Ward, Inc.",
        role: INSTRUMENT_PARTY_ROLE.CUSTODIAN,
      },
      {
        displayName: legalName,
        role: INSTRUMENT_PARTY_ROLE.COMMERCIAL_PARTICIPANT,
      },
    ],
    settlement: {
      publicId: DSI_PUBLIC_ID,
      counterpartyName: legalName,
      counterpartyRepresentative: INDERAKSH_REPRESENTATIVE,
      commodity: "Au Dore Bars",
      transactionDescription: "Initial 50 KG Au Dore Bars Shipment",
      settlementPurpose:
        "7.5% Good-Faith Transaction Authorization Payment (TAP) for the initial 50 KG shipment, calculated from the purchase price and designated to fund the documented export-fee process",
      proceduralBasis:
        "French-Ward has authorized this transaction-specific Good-Faith Transaction Authorization Payment (TAP) as a pre-SPA procedure based on the buyer submission and supplemental commercial direction. The TAP is designated specifically to fund documented export fees required to obtain the applicable export documentation and place the gold before the competent authorities for authorization to lawfully leave Mali. The signed LOI supports buyer identity and the proposed transaction profile but does not itself establish the pricing calculation or TAP obligation shown here. Receipt of the TAP does not replace, execute, or amend the SPA; does not itself constitute commodity allocation; and does not substitute for governmental issuance of export documentation or export authorization.",
      quantityKg: "50",
      pricingStatus: DIGITAL_SETTLEMENT_PRICING_STATUS.PENDING_FIXING,
      pricingBasis: "LBMA Gold Price PM less 10%",
      spotDiscountPercentage: "10",
      spotBenchmark: null,
      spotPricePerKgUsd: null,
      pricePerKgUsd: null,
      transactionValueUsd: null,
      settlementPercentage: "7.5",
      settlementAmountUsd: null,
      priceFixedAt: null,
      settlementAsset: DIGITAL_SETTLEMENT_ASSET.USDT,
      settlementNetwork: DIGITAL_SETTLEMENT_NETWORK.ETHEREUM_ERC20,
      receivingEntity: "French-Ward, Inc.",
      receivingAddress: null,
      receivingWalletId: null,
      receivingWalletRole: null,
      verificationAmountUsdt: "50",
      settlementStatus: DIGITAL_SETTLEMENT_STATUS.PENDING_ISSUANCE,
    },
  } as const;
}
