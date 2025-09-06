#!/usr/bin/env bash
set -euo pipefail

[ -f .env ] && set -a && . ./.env && set +a

: "${ETHERSCAN_API_KEY:?ETHERSCAN_API_KEY required}"
: "${SEPOLIA_RPC_URL:?SEPOLIA_RPC_URL required}"

export FOUNDRY_CONFIG="contracts/foundry.toml"

TARGET="${VERIFY_TARGET:-}"
if [[ "$TARGET" != "protium" && "$TARGET" != "axg" ]]; then
  echo "❌ VERIFY_TARGET must be 'protium' or 'axg'"; exit 1
fi

if [ "$TARGET" = "protium" ]; then
  RUN_FILE="broadcast/DeployProtium.s.sol/11155111/run-latest.json"
  CONTRACT="contracts/src/ProtiumToken.sol:ProtiumToken"
  ADDR="${PROTIUM_TOKEN_ADDRESS:-}"
elif [ "$TARGET" = "axg" ]; then
  RUN_FILE="broadcast/DeployGold.s.sol/11155111/run-latest.json"
  CONTRACT="contracts/src/GoldPeggedStablecoin.sol:GoldPeggedStablecoin"
  ADDR="${AXG_TOKEN_ADDRESS:-}"
fi

[ ! -f "$RUN_FILE" ] && { echo "❌ ${RUN_FILE} not found"; exit 1; }
[[ ! "$ADDR" =~ ^0x[0-9a-fA-F]{40}$ ]] && { echo "❌ Contract address missing/invalid in env"; exit 1; }

# constructor args:
OWNER_ARGS=""
if [ "$TARGET" = "protium" ]; then
  # ProtiumToken(owner, receiver, supply)
  if command -v jq >/dev/null 2>&1; then
    OWNER=$(jq -r '.transactions[0].arguments[0]' "$RUN_FILE" 2>/dev/null || echo "")
    RECEIVER=$(jq -r '.transactions[0].arguments[1]' "$RUN_FILE" 2>/dev/null || echo "")
    SUPPLY=$(jq -r '.transactions[0].arguments[2]' "$RUN_FILE" 2>/dev/null || echo "")
  else
    OWNER=""; RECEIVER=""; SUPPLY=""
  fi
  if [[ "$OWNER" =~ ^0x && "$RECEIVER" =~ ^0x && "$SUPPLY" =~ ^[0-9]+$ ]]; then
    OWNER_ARGS=(--constructor-args "$(cast abi-encode "constructor(address,address,uint256)" "$OWNER" "$RECEIVER" "$SUPPLY")")
  else
    OWNER_ARGS=()
  fi
else
  # GoldPeggedStablecoin(goldUsdFeed, ethUsdFeed)
  if command -v jq >/dev/null 2>&1; then
    GOLD=$(jq -r '.transactions[0].arguments[0]' "$RUN_FILE" 2>/dev/null || echo "")
    ETH=$(jq -r '.transactions[0].arguments[1]' "$RUN_FILE" 2>/dev/null || echo "")
  else
    GOLD=""; ETH=""
  fi
  if [[ "$GOLD" =~ ^0x && "$ETH" =~ ^0x ]]; then
    OWNER_ARGS=(--constructor-args "$(cast abi-encode "constructor(address,address)" "$GOLD" "$ETH")")
  else
    OWNER_ARGS=()
  fi
fi

echo "→ Verifying $ADDR ($TARGET)…"
forge verify-contract \
  --chain sepolia \
  "$ADDR" \
  "$CONTRACT" \
  --etherscan-api-key "$ETHERSCAN_API_KEY" \
  ${OWNER_ARGS[@]:-} \
  --watch