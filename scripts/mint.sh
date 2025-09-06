#!/usr/bin/env bash
set -euo pipefail

# Load .env if present
if [ -f .env ]; then set -a; . ./.env; set +a; fi

export FOUNDRY_CONFIG="contracts/foundry.toml"

TARGET="${MINT_TARGET:-protium}"  # "protium" | "gold"

# Shared key (required)
PK="${COUNCIL_SIGNER_PRIVATE_KEY:-${PRIVATE_KEY:-}}"
if [ -z "${PK:-}" ]; then
  echo "❌ COUNCIL_SIGNER_PRIVATE_KEY / PRIVATE_KEY not set"
  exit 1
fi

RPC="${SEPOLIA_RPC_URL:?SEPOLIA_RPC_URL missing}"

if [ "$TARGET" = "protium" ]; then
  ADDR="${PROTIUM_TOKEN_ADDRESS:?PROTIUM_TOKEN_ADDRESS missing}"
  echo "→ Minting PRT on Sepolia..."
  forge script contracts/script/MintProtiumLocal.s.sol:MintProtiumLocal \
    --rpc-url "$RPC" \
    --private-key "$PK" \
    --broadcast -vv
elif [ "$TARGET" = "gold" ]; then
  ADDR="${AXG_TOKEN_ADDRESS:?AXG_TOKEN_ADDRESS missing}"
  echo "→ Minting AXG/GLDUSD on Sepolia..."
  forge script contracts/script/MintGoldLocal.s.sol:MintGoldLocal \
    --rpc-url "$RPC" \
    --private-key "$PK" \
    --broadcast -vv
else
  echo "❌ Unknown MINT_TARGET: $TARGET (use 'protium' or 'gold')"
  exit 1
fi

echo "→ Done."