#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   DEPLOY_TARGET=protium ./scripts/verify.sh
#   DEPLOY_TARGET=gold    ./scripts/verify.sh
TARGET="${DEPLOY_TARGET:-protium}"

# 1) Load .env
if [ -f .env ]; then set -a; . ./.env; set +a; fi

# 2) Guards
: "${ETHERSCAN_API_KEY:?ETHERSCAN_API_KEY is required}"
: "${SEPOLIA_RPC_URL:?SEPOLIA_RPC_URL is required}"

export FOUNDRY_CONFIG="contracts/foundry.toml"

# 3) Pick broadcast folder and contract FQN
case "$TARGET" in
  protium)
    BCAST_DIR="broadcast/DeployProtium.s.sol/11155111"
    CONTRACT_FQN="contracts/src/ProtiumToken.sol:ProtiumToken"
    ;;
  gold)
    BCAST_DIR="broadcast/DeployGold.s.sol/11155111"
    CONTRACT_FQN="contracts/src/GoldPeggedStablecoin.sol:GoldPeggedStablecoin"
    ;;
  *)
    echo "❌ Unknown DEPLOY_TARGET '$TARGET' (use 'protium' or 'gold')"
    exit 1
    ;;
esac

RUN_FILE="${BCAST_DIR}/run-latest.json"
if [ ! -f "$RUN_FILE" ]; then
  echo "❌ ${RUN_FILE} not found."
  exit 1
fi

# 4) Pull address & constructor args from broadcast JSON
if command -v jq >/dev/null 2>&1; then
  ADDR="$(jq -r '
    .transactions
    | (map(select(.transactionType=="CREATE")) // .)
    | map(.contractAddress // empty)
    | map(select(type=="string"))
    | .[0] // empty
  ' "$RUN_FILE")"

  ARG0="$(jq -r '.transactions[0].arguments[0] // empty' "$RUN_FILE")"
  ARG1="$(jq -r '.transactions[0].arguments[1] // empty' "$RUN_FILE")"
  ARG2="$(jq -r '.transactions[0].arguments[2] // empty' "$RUN_FILE")"
else
  ADDR="$(grep -Eo '"contractAddress"\s*:\s*"0x[0-9a-fA-F]{40}"' "$RUN_FILE" \
    | head -n1 | grep -Eo '0x[0-9a-fA-F]{40}')"
  ARG0=""; ARG1=""; ARG2="";
fi

if [[ ! "${ADDR:-}" =~ ^0x[0-9a-fA-F]{40}$ ]]; then
  echo "❌ Could not extract deployed contract address from ${RUN_FILE}"
  exit 1
fi

echo "→ Verifying $ADDR (target=$TARGET)"
echo "→ Contract FQN: $CONTRACT_FQN"

# 5) Build constructor arg blob (if we have them)
ARGS_ENC=""
if [ "$TARGET" = "protium" ]; then
  # ProtiumToken(address owner, address receiver, uint256 initialSupply)
  if [ -n "${ARG0:-}" ] && [ -n "${ARG1:-}" ] && [ -n "${ARG2:-}" ]; then
    echo "→ Constructor args:"
    echo "   owner    : $ARG0"
    echo "   receiver : $ARG1"
    echo "   supply   : $ARG2"
    ARGS_ENC="$(cast abi-encode 'constructor(address,address,uint256)' "$ARG0" "$ARG1" "$ARG2")"
  else
    echo "→ No constructor args found in broadcast; will try verification without explicit args."
  fi
else
  # GoldPeggedStablecoin(address goldUsdFeed, address ethUsdFeed)
  if [ -n "${ARG0:-}" ] && [ -n "${ARG1:-}" ]; then
    echo "→ Constructor args:"
    echo "   goldUsdFeed : $ARG0"
    echo "   ethUsdFeed  : $ARG1"
    ARGS_ENC="$(cast abi-encode 'constructor(address,address)' "$ARG0" "$ARG1")"
  else
    echo "→ No constructor args found in broadcast; will try verification without explicit args."
  fi
fi

# 6) Verify
if [ -n "${ARGS_ENC:-}" ]; then
  forge verify-contract \
    --chain sepolia \
    "$ADDR" \
    "$CONTRACT_FQN" \
    --constructor-args "$ARGS_ENC" \
    --etherscan-api-key "$ETHERSCAN_API_KEY" \
    --watch
else
  forge verify-contract \
    --chain sepolia \
    "$ADDR" \
    "$CONTRACT_FQN" \
    --etherscan-api-key "$ETHERSCAN_API_KEY" \
    --watch
fi