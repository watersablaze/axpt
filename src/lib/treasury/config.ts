import type { Address } from "viem";

export type TreasuryWallet = {
  id: string;
  name: string;
  address: Address;
  role: "dev" | "operations" | "treasury";
  risk: "high" | "medium" | "low";
};

export const TREASURY_WALLETS: TreasuryWallet[] = [
  {
    id: "axpt-dev",
    name: "AXPT Dev",
    address: "0x3D62cfd6a4E759b6400a8D9a2Fa4D07d574aB13c" as Address,
    role: "dev",
    risk: "high",
  },
  {
    id: "axpt-operations",
    name: "AXPT Operations",
    address: "0x40143ECEF96EC52365c6E3164dE891C62c9A012E" as Address,
    role: "operations",
    risk: "medium",
  },
  {
    id: "axpt-treasury",
    name: "AXPT Treasury",
    address: "0x82563D9c59055A44D2633C76F08c1E1F7BfE021F" as Address,
    role: "treasury",
    risk: "low",
  },
];

export const TOKENS = {
  USDT: {
    symbol: "USDT",
    decimals: 6,
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" as Address,
  },
} as const;