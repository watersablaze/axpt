function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function num(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`Invalid number env: ${name}`);
  return n;
}

export const ENV = {
  RPC_URL: req('SEPOLIA_RPC_URL'),
  TREASURY_PRIVATE_KEY: req('TREASURY_PRIVATE_KEY'),
  MIRROR_BRIDGE_ADDRESS: req('EVM_MIRROR_BRIDGE_ADDRESS'),
  CHAIN_ID: num('CHAIN_MIRROR_CHAIN_ID', 11155111),

  WORKER_ID: process.env.CHAIN_MIRROR_WORKER_ID || 'mirror-worker-1',
  POLL_MS: num('CHAIN_MIRROR_POLL_MS', 3000),
  BATCH_SIZE: num('CHAIN_MIRROR_BATCH_SIZE', 10),
  CLAIM_TTL_MS: num('CHAIN_MIRROR_CLAIM_TTL_MS', 60_000),
  MIN_CONFIRMATIONS: num('CHAIN_MIRROR_MIN_CONFIRMATIONS', 2),
  MAX_ATTEMPTS: num('CHAIN_MIRROR_MAX_ATTEMPTS', 12),
};