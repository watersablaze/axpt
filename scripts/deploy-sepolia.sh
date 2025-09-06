#!/usr/bin/env bash
set -euo pipefail

# --- Helpers ---------------------------------------------------------------
red()   { printf "\033[31m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
note()  { printf "→ %s\n" "$*"; }

normalize_pk() {
  # strip spaces, newlines, tabs; ensure 0x prefix
  local pk="${1:-}"
  pk="$(printf %s "$pk" | tr -d ' \n\r\t')"
  if [[ -n "$pk" && "${pk:0:2}" != "0x" ]]; then
    pk="0x${pk}"
  fi
  printf %s "$pk"
}

# --- Env -------------------------------------------------------------------
# Load .env if present
if [[ -f .env ]]; then set -a; . ./.env; set +a; fi

: "${SEPOLIA_RPC_URL:?SEPOLIA_RPC_URL missing}"

# Prefer council key; fall back to PRIVATE_KEY
PK_RAW="${COUNCIL_SIGNER_PRIVATE_KEY:-${PRIVATE_KEY:-}}"
PK="$(normalize_pk "$PK_RAW")"

if [[ -z "$PK" ]]; then
  red "❌ PRIVATE_KEY / COUNCIL_SIGNER_PRIVATE_KEY not set"
  exit 1
fi

# Basic sanity: 0x + 64 hex chars -> 66 length
if [[ ${#PK} -ne 66 || ! "$PK" =~ ^0x[0-9a-fA-F]{64}$ ]]; then
  red "❌ Private key appears malformed (len=${#PK}). Expected 66 chars (0x + 64 hex)."
  exit 1
fi

# Foundry config explicit
export FOUNDRY_CONFIG="contracts/foundry.toml"

# --- Build -----------------------------------------------------------------
note "Building (Foundry)…"
forge build

# --- Deploy ----------------------------------------------------------------
note "Deploying ProtiumToken to Sepolia…"
set +e
forge script contracts/script/DeployProtium.s.sol:DeployProtium \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$PK" \
  --broadcast -vvv
SCRIPT_EXIT=$?
set -e

if [[ $SCRIPT_EXIT -ne 0 ]]; then
  note "⚠️  forge script returned non-zero (often verify-related). Will still try to read broadcast file."
fi

BROADCAST_DIR="broadcast/DeployProtium.s.sol/11155111"
RUN_FILE="${BROADCAST_DIR}/run-latest.json"
if [[ ! -f "$RUN_FILE" ]]; then
  red "❌ ${RUN_FILE} not found (deploy may have aborted)"
  exit 1
fi

# --- Address extraction (robust) -------------------------------------------
ADDR=""

if command -v jq >/dev/null 2>&1; then
  ADDR="$(jq -r '
    def addrs:
      [
        (.transactions // [])[]? | select(.contractAddress? != null and (.contractAddress|type=="string")) | .contractAddress
      ] + [
        (.receipts // [])[]? | .contractAddress? // empty
      ];
    addrs[] | select(type=="string") | select(test("^0x[0-9a-fA-F]{40}$")) | . 
  ' "$RUN_FILE" | head -n1)"
else
  # fallback: grep first 0x..40 from contractAddress fields
  ADDR="$(grep -Eo '"contractAddress"\s*:\s*"0x[0-9a-fA-F]{40}"' "$RUN_FILE" | head -n1 | grep -Eo '0x[0-9a-fA-F]{40}')"
fi

if [[ ! "$ADDR" =~ ^0x[0-9a-fA-F]{40}$ ]]; then
  red "❌ Could not extract deployed address from ${RUN_FILE}"
  exit 1
fi

note "Deployed address: ${ADDR}"

# --- Update .env -----------------------------------------------------------
if [[ -f .env ]]; then
  if grep -q '^PROTIUM_TOKEN_ADDRESS=' .env; then
    # macOS-safe sed
    sed -i.bak "s|^PROTIUM_TOKEN_ADDRESS=.*$|PROTIUM_TOKEN_ADDRESS=${ADDR}|" .env && rm -f .env.bak
  else
    printf "\nPROTIUM_TOKEN_ADDRESS=%s\n" "$ADDR" >> .env
  fi
  note ".env updated with PROTIUM_TOKEN_ADDRESS=${ADDR}"
else
  printf "PROTIUM_TOKEN_ADDRESS=%s\n" "$ADDR" > .env
  note "Created .env with PROTIUM_TOKEN_ADDRESS=${ADDR}"
fi

# --- Snapshot for UI -------------------------------------------------------
JSON_PATH="src/lib/chain/addresses.local.json"
mkdir -p "$(dirname "$JSON_PATH")"
cat > "$JSON_PATH" <<JSON
{
  "chainId": 11155111,
  "updatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "protiumToken": "${ADDR}"
}
JSON
note "Wrote ${JSON_PATH}"

note "Done. See ${RUN_FILE} for full tx details."