#!/usr/bin/env bash
set -euo pipefail

# Load .env if present
if [ -f .env ]; then
  set -a; . ./.env; set +a
fi

# Sanity: RPC + PK + token address
: "${SEPOLIA_RPC_URL:?Set SEPOLIA_RPC_URL in .env}"
# Accept either of these keys:
PK="${COUNCIL_SIGNER_PRIVATE_KEY:-${PRIVATE_KEY:-}}"
if [ -z "${PK:-}" ]; then
  echo "❌ Set COUNCIL_SIGNER_PRIVATE_KEY or PRIVATE_KEY in .env"
  exit 1
fi

: "${PROTIUM_TOKEN_ADDRESS:?Set PROTIUM_TOKEN_ADDRESS in .env}"

# Optional: who to mint & how much (whole tokens)
MINT_TO="${MINT_TO:-}"
MINT_AMOUNT_TOKENS="${MINT_AMOUNT_TOKENS:-1000}"

echo "→ Minting ${MINT_AMOUNT_TOKENS} PRT to ${MINT_TO:-<deployer>} on Sepolia..."
forge script contracts/script/MintProtiumLocal.s.sol:MintProtiumLocal \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$PK" \
  --broadcast -vvvv

echo "→ Done. Tip: set NEXT_PUBLIC_TEST_ACCOUNT to the recipient for the UI pill."