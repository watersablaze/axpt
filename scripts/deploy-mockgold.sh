#!/usr/bin/env bash
set -euo pipefail

# Load .env
if [ -f .env ]; then set -a; . ./.env; set +a; fi

export FOUNDRY_CONFIG="contracts/foundry.toml"

echo "→ Deploying Mock GOLD/USD feed…"

forge script contracts/script/DeployMockGoldFeed.s.sol:DeployMockGoldFeed \
  --rpc-url "${SEPOLIA_RPC_URL:?SEPOLIA_RPC_URL missing}" \
  --private-key "${PRIVATE_KEY:?PRIVATE_KEY missing}" \
  --broadcast -vv | tee /tmp/mockgold.log

# Extract address
ADDR=$(grep -Eo '0x[a-fA-F0-9]{40}' /tmp/mockgold.log | tail -n1)

if [[ "$ADDR" =~ ^0x[0-9a-fA-F]{40}$ ]]; then
  if grep -q '^GOLD_USD_FEED=' .env; then
    sed -i.bak "s|^GOLD_USD_FEED=.*$|GOLD_USD_FEED=${ADDR}|" .env && rm -f .env.bak
  else
    echo "GOLD_USD_FEED=${ADDR}" >> .env
  fi
  echo "→ Updated .env with GOLD_USD_FEED=$ADDR"
else
  echo "❌ Could not parse deployed address."
  exit 1
fi