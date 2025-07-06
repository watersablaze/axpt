#!/bin/bash

echo ""
echo "🔍 Verifying AXPT Deployment Configuration..."
echo "=============================================="


# 1. Check .env for required variables
REQUIRED_VARS=(DATABASE_URL NEXTAUTH_SECRET AXPT_JWT_SECRET AXPT_PARTNER_SALT)

echo "🧪 Checking .env variables..."
MISSING_VARS=0
for VAR in "${REQUIRED_VARS[@]}"; do
  if ! grep -q "^$VAR=" .env; then
    echo "❌ Missing: $VAR"
    ((MISSING_VARS++))
  else
    echo "✅ Found: $VAR"
  fi
done

# 2. Confirm NODE_ENV is production
echo ""
echo "🌐 Checking NODE_ENV..."
if [[ "$NODE_ENV" == "production" ]]; then
  echo "✅ NODE_ENV is set to production"
else
  echo "⚠️  NODE_ENV is '$NODE_ENV' (should be 'production' for deploy)"
fi

# 3. Validate next.config.ts
echo ""
echo "🔧 Sanity check: next.config.ts..."

CONFIG_PATH="next.config.ts"

check_line() {
  grep -q "$1" "$CONFIG_PATH" && echo "✅ $2" || echo "❌ $2"
}

check_line "removeConsole: process.env.NODE_ENV === \\\"production\\\"" "removeConsole is conditionally set"
check_line "optimizeCss: true" "optimizeCss enabled"
check_line "hostname: \\\"\\*\\*\\.axpt\\.io\\\"" "Wildcard domain axpt.io is configured"
check_line "destination: \\\"/landing\\\"" "Redirect to /landing is configured"
check_line "alias: {" "Alias section is defined"
check_line "canvas: false" "canvas fallback is configured"

# 4. Final result
echo ""
if [ "$MISSING_VARS" -eq 0 ]; then
  echo "🎉 All critical checks passed."
else
  echo "⚠️  $MISSING_VARS .env variable(s) missing. Please update your .env file."
fi

echo "✅ Configuration verification complete."