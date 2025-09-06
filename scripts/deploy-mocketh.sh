#!/usr/bin/env bash
set -euo pipefail

# Load env
if [ -f .env ]; then set -a; . ./.env; set +a; fi

: "${SEPOLIA_RPC_URL:?SEPOLIA_RPC_URL is required}"
PK="${COUNCIL_SIGNER_PRIVATE_KEY:-${PRIVATE_KEY:-}}"
if [ -z "${PK:-}" ]; then
  echo "❌ PRIVATE_KEY / COUNCIL_SIGNER_PRIVATE_KEY not set"
  exit 1
fi

export FOUNDRY_CONFIG="contracts/foundry.toml"
echo "→ Deploying Mock ETH/USD feed…"
forge script contracts/script/DeployMockEthFeed.s.sol:DeployMockEthFeed \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$PK" \
  --broadcast -vv

RUN="broadcast/DeployMockEthFeed.s.sol/11155111/run-latest.json"
if [ ! -f "$RUN" ]; then
  echo "❌ $RUN not found"
  exit 1
fi

ADDR="$(jq -r '
  if (.transactions // []) | length > 0 then
    (.transactions[] | .contractAddress // empty) | select(type=="string")
  else empty end
' "$RUN" | head -n1)"

if [[ ! "$ADDR" =~ ^0x[0-9a-fA-F]{40}$ ]]; then
  echo "❌ Could not extract feed address"
  exit 1
fi

# write/update .env
if [ -f .env ]; then
  if grep -q '^ETH_USD_FEED=' .env; then
    sed -i.bak "s|^ETH_USD_FEED=.*$|ETH_USD_FEED=${ADDR}|" .env && rm -f .env.bak
  else
    printf "\nETH_USD_FEED=%s\n" "$ADDR" >> .env
  fi
else
  printf "ETH_USD_FEED=%s\n" "$ADDR" > .env
fi

echo "→ Updated .env with ETH_USD_FEED=$ADDR"