#!/usr/bin/env bash
set -euo pipefail

# --- Load .env if present (so scripts/check-env.sh sees vars) ---
if [ -f .env ]; then
  set -a; . ./.env; set +a
fi

# --- Fast deploy-only env checks (non-TS) ---
bash scripts/check-env.sh

echo "→ Building contracts..."
forge build

# Pick key: prefer COUNCIL_SIGNER_PRIVATE_KEY, fallback PRIVATE_KEY
PK="${COUNCIL_SIGNER_PRIVATE_KEY:-${PRIVATE_KEY:-}}"
if [ -z "$PK" ]; then
  echo "❌ No deployer key found (COUNCIL_SIGNER_PRIVATE_KEY or PRIVATE_KEY)."
  exit 1
fi

echo "→ Deploying ProtiumToken to Sepolia..."
set +e
forge script contracts/script/DeployProtium.s.sol:DeployProtium \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$PK" \
  --broadcast -vvvv \
  ${ETHERSCAN_API_KEY:+--verify --etherscan-api-key "$ETHERSCAN_API_KEY"}
SCRIPT_EXIT=$?
set -e

if [ $SCRIPT_EXIT -ne 0 ]; then
  echo "⚠️  forge script returned non-zero (often verify-related). Continuing to extract address…"
fi

BROADCAST_DIR="broadcast/DeployProtium.s.sol/11155111"
RUN_FILE="${BROADCAST_DIR}/run-latest.json"

if [ ! -f "$RUN_FILE" ]; then
  echo "❌ Could not find ${RUN_FILE}. Did the script broadcast?"
  exit 1
fi

# --- Robust extraction of the deployed address, regardless of nesting ---
ADDR=""
if command -v jq >/dev/null 2>&1; then
  ADDR="$(jq -r '.. | .contractAddress? // empty' "$RUN_FILE" \
    | grep -E '^0x[0-9a-fA-F]{40}$' \
    | head -n1)"
else
  ADDR="$(grep -Eo '"contractAddress"\s*:\s*"0x[0-9a-fA-F]{40}"' "$RUN_FILE" \
    | head -n1 \
    | grep -Eo '0x[0-9a-fA-F]{40}')"
fi

[ -n "${ADDR:-}" ] || { echo "❌ Could not extract deployed address from ${RUN_FILE}"; exit 1; }
echo "→ Deployed address: ${ADDR}"

# --- Update .env (idempotent) ---
if [ -f .env ]; then
  if grep -q '^PROTIUM_TOKEN_ADDRESS=' .env; then
    sed -i.bak "s|^PROTIUM_TOKEN_ADDRESS=.*$|PROTIUM_TOKEN_ADDRESS=${ADDR}|" .env && rm -f .env.bak
  else
    printf "\nPROTIUM_TOKEN_ADDRESS=%s\n" "$ADDR" >> .env
  fi
  echo "→ .env updated with PROTIUM_TOKEN_ADDRESS=${ADDR}"
else
  printf "PROTIUM_TOKEN_ADDRESS=%s\n" "$ADDR" > .env
  echo "→ Created .env with PROTIUM_TOKEN_ADDRESS=${ADDR}"
fi

# --- Write a JSON snapshot consumed by addresses.ts ---
JSON_PATH="src/lib/chain/addresses.local.json"
mkdir -p "$(dirname "$JSON_PATH")"
cat > "$JSON_PATH" <<JSON
{
  "chainId": 11155111,
  "updatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "protiumToken": "${ADDR}"
}
JSON
echo "→ Wrote ${JSON_PATH}"

echo "→ Done. See ${RUN_FILE} for full tx details."