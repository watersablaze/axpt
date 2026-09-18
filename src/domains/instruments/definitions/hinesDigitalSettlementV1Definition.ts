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

export const HINES_DSI_REFERENCE = "FW-DSI-2026-001" as const;
export const HINES_DSI_PUBLIC_ID = "fw-dsi-2026-001" as const;
export const INDERAKSH_LEGAL_NAME = "Inderaksh Gold Refinery FZ-LLC" as const;
export const INDERAKSH_REPRESENTATIVE =
  "Corey Keller, Vice President" as const;

export function createHinesDigitalSettlementV1Definition(
  counterpartyLegalName: string,
) {
  const legalName = counterpartyLegalName.trim();

  if (!legalName) {
    throw new Error("[DSI_COUNTERPARTY_LEGAL_NAME_REQUIRED]");
  }

  return {
    instrument: {
      reference: HINES_DSI_REFERENCE,
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
      publicId: HINES_DSI_PUBLIC_ID,
      counterpartyName: legalName,
      counterpartyRepresentative: INDERAKSH_REPRESENTATIVE,
      commodity: "Au Dore Bars",
      transactionDescription: "Initial 50 KG Au Dore Bars Shipment",
      settlementPurpose:
        "7.5% good-faith transaction activation for the initial 50 KG shipment, calculated from the purchase price",
      proceduralBasis:
        "Authorized as a good-faith pre-SPA procedure relating to the buyer's willingness to fund Mali export-tax requirements. Receipt does not replace, execute, or amend the SPA.",
      quantityKg: "50",
      pricingStatus: DIGITAL_SETTLEMENT_PRICING_STATUS.PENDING_FIXING,
      pricingBasis: "Gold spot price less 10%",
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
