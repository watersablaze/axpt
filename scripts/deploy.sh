#!/usr/bin/env bash
set -euo pipefail

# Load env
[ -f .env ] && set -a && . ./.env && set +a

export FOUNDRY_CONFIG="contracts/foundry.toml"

TARGET="${DEPLOY_TARGET:-}"
if [[ "$TARGET" != "protium" && "$TARGET" != "axg" ]]; then
  echo "❌ DEPLOY_TARGET must be 'protium' or 'axg'"; exit 1
fi

echo "→ Building (Foundry)…"
forge build

PK="${COUNCIL_SIGNER_PRIVATE_KEY:-${PRIVATE_KEY:-}}"
RPC="${SEPOLIA_RPC_URL:-}"
if [ -z "${PK:-}" ] || [ -z "${RPC:-}" ]; then
  echo "❌ Missing PRIVATE KEY or SEPOLIA_RPC_URL"; exit 1
fi

if [ "$TARGET" = "protium" ]; then
  SCRIPT="contracts/script/DeployProtium.s.sol:DeployProtium"
  BROADCAST_DIR="broadcast/DeployProtium.s.sol/11155111"
  ENV_VAR="PROTIUM_TOKEN_ADDRESS"
elif [ "$TARGET" = "axg" ]; then
  SCRIPT="contracts/script/DeployGold.s.sol:DeployGold"
  BROADCAST_DIR="broadcast/DeployGold.s.sol/11155111"
  ENV_VAR="AXG_TOKEN_ADDRESS"
fi

echo "→ Deploying ($TARGET) to Sepolia…"
set +e
forge script "$SCRIPT" \
  --rpc-url "$RPC" \
  --private-key "$PK" \
  --broadcast -vvv
EXIT=$?
set -e
[ $EXIT -ne 0 ] && echo "⚠️  forge script returned non-zero; will still parse broadcast."

RUN_FILE="${BROADCAST_DIR}/run-latest.json"
[ ! -f "$RUN_FILE" ] && { echo "❌ ${RUN_FILE} not found"; exit 1; }

ADDR=""
if command -v jq >/dev/null 2>&1; then
  ADDR="$(jq -r '
    if (.transactions // []) | length > 0 then
      (.transactions[] | .contractAddress // empty) | select(type=="string")
    else empty end' "$RUN_FILE" | head -n1)"
else
  ADDR="$(grep -Eo '"contractAddress"\s*:\s*"0x[0-9a-fA-F]{40}"' "$RUN_FILE" | head -n1 | grep -Eo '0x[0-9a-fA-F]{40}')"
fi

[[ ! "$ADDR" =~ ^0x[0-9a-fA-F]{40}$ ]] && { echo "❌ Could not extract address"; exit 1; }
echo "→ Deployed address: $ADDR"

# write .env
if [ -f .env ]; then
  if grep -q "^${ENV_VAR}=" .env; then
    sed -i.bak "s|^${ENV_VAR}=.*$|${ENV_VAR}=${ADDR}|" .env && rm -f .env.bak
  else
    printf "\n%s=%s\n" "$ENV_VAR" "$ADDR" >> .env
  fi
else
  printf "%s=%s\n" "$ENV_VAR" "$ADDR" > .env
fi
echo "→ .env updated: ${ENV_VAR}=${ADDR}"

# dev snapshot (optional)
JSON_PATH="src/lib/chain/addresses.local.json"
mkdir -p "$(dirname "$JSON_PATH")"
cat > "$JSON_PATH" <<JSON
{
  "chainId": 11155111,
  "updatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "protiumToken": "${PROTIUM_TOKEN_ADDRESS:-null}",
  "axgToken": "${AXG_TOKEN_ADDRESS:-null}"
}
JSON

echo "→ Wrote ${JSON_PATH}"
echo "→ Done. See ${RUN_FILE}"