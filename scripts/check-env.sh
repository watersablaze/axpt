#!/usr/bin/env bash
set -euo pipefail

fail() { echo "❌ $*" >&2; exit 1; }
warn() { echo "⚠️  $*" >&2; }
ok()   { echo "✅ $*"; }

trim() { awk '{$1=$1;print}' <<< "$1"; }

# Load .env if present (non-fatal if missing)
if [ -f .env ]; then
  set -a; . ./.env; set +a
fi

# --- Required for deploy ---
: "${SEPOLIA_RPC_URL:?Set SEPOLIA_RPC_URL in your .env}"
: "${COUNCIL_SIGNER_PRIVATE_KEY:?Set COUNCIL_SIGNER_PRIVATE_KEY in your .env (0x + 64 hex)}"

# Normalize values
SEPOLIA_RPC_URL="$(trim "${SEPOLIA_RPC_URL}")"
COUNCIL_SIGNER_PRIVATE_KEY="$(trim "${COUNCIL_SIGNER_PRIVATE_KEY}")"
ETHERSCAN_API_KEY="$(trim "${ETHERSCAN_API_KEY:-}")"

# Checks
[[ "$SEPOLIA_RPC_URL" =~ ^https?:// ]] || fail "SEPOLIA_RPC_URL must start with http(s)://"
[[ "$COUNCIL_SIGNER_PRIVATE_KEY" =~ ^0x[0-9a-fA-F]{64}$ ]] || fail "COUNCIL_SIGNER_PRIVATE_KEY must be 0x + 64 hex chars"

# Etherscan API key is optional; warn if it looks wrong
if [ -n "$ETHERSCAN_API_KEY" ]; then
  # Etherscan keys are alphanumeric (usually 32–64 chars). We accept 24–64 to be generous.
  if [[ ! "$ETHERSCAN_API_KEY" =~ ^[A-Za-z0-9]{24,64}$ ]]; then
    warn "ETHERSCAN_API_KEY looks odd (non-alphanumeric or wrong length). Verification may fail."
  else
    ok "ETHERSCAN_API_KEY looks OK"
  fi
else
  warn "ETHERSCAN_API_KEY not set (verification will be skipped)."
fi

ok "Deploy env check OK"