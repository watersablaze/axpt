import { getAddress } from "viem";

import { TREASURY_WALLETS } from "@/lib/treasury/config";

export const SETTLEMENT_INGRESS_WALLET_ROLE = "operations" as const;

export function resolveAuthorizedSettlementIngress(address: string) {
  const checksumAddress = getAddress(address);
  const wallet = TREASURY_WALLETS.find(
    (candidate) =>
      candidate.address.toLowerCase() === checksumAddress.toLowerCase(),
  );

  if (!wallet) {
    throw new Error("[DSI_ISSUANCE_UNREGISTERED_RECEIVING_WALLET]");
  }

  if (wallet.role !== SETTLEMENT_INGRESS_WALLET_ROLE) {
    throw new Error(
      `[DSI_ISSUANCE_INVALID_RECEIVING_WALLET_ROLE] expected=${SETTLEMENT_INGRESS_WALLET_ROLE} actual=${wallet.role}`,
    );
  }

  return {
    ...wallet,
    address: checksumAddress,
  } as const;
}
