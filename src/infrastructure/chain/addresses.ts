// src/lib/chain/addresses.ts
// Resolution order:
// 1) Environment variables  (PROD / CI / local overrides)
// 2) Local JSON snapshot     (written by scripts/deploy-sepolia.sh)
// 3) Hard default/fallback   (empty → forces a helpful error)

type AddressSnapshot = {
  chainId?: number;
  protiumToken?: string;
  auction?: string;
  escrow?: string;
};

let localSnap: AddressSnapshot = {};
try {
  // Optional — exists after first successful deploy
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  localSnap = require('./addresses.local.json');
} catch (_) {
  // file not present yet; that's fine
}

export const CHAIN_ID =
  Number(process.env.NEXT_PUBLIC_CHAIN_ID || localSnap.chainId || 11155111);

export const addresses = {
  token:
    (process.env.PROTIUM_TOKEN_ADDRESS || '').trim() ||
    (localSnap.protiumToken || '').trim(),
  auction:
    (process.env.HYDROGEN_AUCTION_ADDRESS || '').trim() ||
    (localSnap.auction || '').trim(),
  escrow:
    (process.env.ESCROW_SETTLEMENT_ADDRESS || '').trim() ||
    (localSnap.escrow || '').trim(),
};

export function requireAddress(label: keyof typeof addresses): string {
  const addr = addresses[label];
  if (!addr) {
    const envHint =
      label === 'token'
        ? 'PROTIUM_TOKEN_ADDRESS'
        : label === 'auction'
        ? 'HYDROGEN_AUCTION_ADDRESS'
        : 'ESCROW_SETTLEMENT_ADDRESS';
    throw new Error(
      `Missing address for "${label}". Set ${envHint} in .env or deploy (which writes addresses.local.json).`
    );
  }
  return addr;
}

// Dev‑mode nudge
if (process.env.NODE_ENV !== 'production' && !addresses.token) {
  // eslint-disable-next-line no-console
  console.warn(
    '[addresses] PROTIUM_TOKEN_ADDRESS not set. Deploy on Sepolia (pnpm deploy:sepolia) to write src/lib/chain/addresses.local.json'
  );
}