#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   FEED=<address> PRICE=<human_float> [DECIMALS=8] bash scripts/update-mockfeed.sh
#
# Example:
#   FEED=0x15aD414A7ad66cd4C9461c5e3aEdCf3e8FF8b176 PRICE=1923.45 bash scripts/update-mockfeed.sh
#
# Notes:
# - PRICE is a human number (e.g. 1923.45). We scale it by DECIMALS into an int for updateAnswer(int256).
# - Requires PRIVATE_KEY or COUNCIL_SIGNER_PRIVATE_KEY and SEPOLIA_RPC_URL.

if [ -f .env ]; then set -a; . ./.env; set +a; fi

: "${SEPOLIA_RPC_URL:?SEPOLIA_RPC_URL is required}"
PK="${COUNCIL_SIGNER_PRIVATE_KEY:-${PRIVATE_KEY:-}}"
: "${PK:?PRIVATE_KEY / COUNCIL_SIGNER_PRIVATE_KEY is required}"
: "${FEED:?FEED (mock aggregator address) is required}"
: "${PRICE:?PRICE is required}"

DECIMALS="${DECIMALS:-8}"

# scale PRICE -> scaled integer using Python for safety/precision
SCALED="$(python3 - <<PY
from decimal import Decimal, getcontext
import os
getcontext().prec = 60
price = Decimal(os.environ["PRICE"])
dec   = int(os.environ["DECIMALS"])
scaled = int(price * (10 ** dec))
print(scaled)
PY
)"

echo "→ Updating feed $FEED to PRICE=$PRICE (scaled=$SCALED @ decimals=$DECIMALS)…"

cast send "$FEED" "updateAnswer(int256)" "$SCALED" \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$PK" \
  --legacy >/dev/null

echo "→ Done."