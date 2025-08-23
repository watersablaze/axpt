#!/usr/bin/env bash
set -euo pipefail

# Load .env if we're not already under dotenv (or if you still want to load).
# You can disable this by running with: LOAD_ENV_FROM_FILE=0 bash scripts/check-etherscan.sh
if [ "${LOAD_ENV_FROM_FILE:-1}" = "1" ] && [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

: "${ETHERSCAN_API_KEY:?Set ETHERSCAN_API_KEY in your .env}"

echo "→ Checking Etherscan API key validity..."
resp="$(curl -s "https://api.etherscan.io/api?module=account&action=balance&address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&tag=latest&apikey=${ETHERSCAN_API_KEY}")"

if echo "$resp" | grep -q '"status":"1"'; then
  echo "✅ Etherscan API key is valid."
else
  echo "❌ Etherscan API key may be invalid or rate-limited."
  echo "Response: $resp"
  exit 1
fi