#!/bin/bash

echo ""
echo "🔍 AXPT.io Token System Sanity Check + Type Audit"
echo "───────────────────────────────────────────────────────"

PASS=true

# Check .env
if [ ! -f ".env" ]; then
  echo "❌ .env file missing!"
  PASS=false
else
  echo "✅ .env file found"
fi

# Check required env vars
grep -q "SIGNING_SECRET=" .env || { echo "❌ SIGNING_SECRET missing from .env"; PASS=false; }
grep -q "LOG_SECRET=" .env || { echo "❌ LOG_SECRET missing from .env"; PASS=false; }

# Check critical files
REQUIRED_FILES=(
  "app/types/token.ts"
  "app/src/utils/token/index.ts"
  "app/api/partner/verify-token/route.ts"
  "app/onboard/page.tsx"
  "app/onboard/investor/page.tsx"
)

for FILE in "${REQUIRED_FILES[@]}"; do
  if [ -f "$FILE" ]; then
    echo "✅ Found $FILE"
  else
    echo "❌ Missing $FILE"
    PASS=false
  fi
done

# Ensure log file and QR directory exist
LOG_FILE="app/scripts/partner-tokens/logs/token-log.json"
QR_DIR="public/qr"

if [ ! -f "$LOG_FILE" ]; then
  echo "⚠️  Creating missing token log at $LOG_FILE"
  mkdir -p "$(dirname "$LOG_FILE")"
  echo "[]" > "$LOG_FILE"
  echo "✅ token-log.json created"
else
  echo "✅ token-log.json found"
fi

if [ ! -d "$QR_DIR" ]; then
  echo "⚠️  Creating missing QR directory at $QR_DIR"
  mkdir -p "$QR_DIR"
  echo "✅ public/qr directory created"
else
  echo "✅ public/qr directory exists"
fi

echo ""
echo "🔎 Type Signature Audit: TokenPayload Usage"
echo "────────────────────────────────────────────"

# Check TokenPayload usage in CLI, UI, Admin
CLI_MATCH=$(grep -r "TokenPayload" app/scripts/partner-tokens | wc -l)
UI_MATCH=$(grep -r "TokenPayload" app/src/components | wc -l)
ADMIN_MATCH=$(grep -r "TokenPayload" app/admin | wc -l)

if [ "$CLI_MATCH" -gt 0 ]; then
  echo "✅ CLI uses TokenPayload"
else
  echo "❌ CLI missing TokenPayload references"
  PASS=false
fi

if [ "$UI_MATCH" -gt 0 ]; then
  echo "✅ UI uses TokenPayload"
else
  echo "❌ UI missing TokenPayload references"
  PASS=false
fi

if [ "$ADMIN_MATCH" -gt 0 ]; then
  echo "✅ Admin uses TokenPayload"
else
  echo "❌ Admin missing TokenPayload references"
  PASS=false
fi

echo ""
echo "────────────────────────────────────────────"
if [ "$PASS" = true ]; then
  echo "✅ All checks passed! System ready for token issuance."
  exit 0
else
  echo "❌ One or more checks failed. Please fix the issues above."
  exit 1
fi