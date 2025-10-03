#!/usr/bin/env bash
# Usage: ACCESS_CODE_SALT="$SIGNING_SECRET" ./scripts/issue-access-code.sh <partner> [tier] [email]

set -euo pipefail

PARTNER="${1:-}"
TIER="${2:-Investor}"
EMAIL="${3:-}"

if [ -z "$PARTNER" ]; then
  echo "Usage: $0 <partner> [tier] [email]" >&2
  exit 1
fi

# Call the Node implementation
node "$(dirname "$0")/issue-access-code.mjs" "$PARTNER" "$TIER" "$EMAIL"