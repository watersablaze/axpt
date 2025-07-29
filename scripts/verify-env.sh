#!/bin/bash

# AXPT Environment Validator
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ⛳️ Skip on Vercel deploys
if [[ "$VERCEL" == "1" ]]; then
  echo "⚠️  Skipping verify-env.sh in Vercel build environment."
  exit 0
fi

# Determine .env file to use
ENV_FILE=""
if [[ -f .env.local ]]; then
  ENV_FILE=".env.local"
elif [[ -f .env.production ]]; then
  ENV_FILE=".env.production"
elif [[ -f .env ]]; then
  ENV_FILE=".env"
else
  echo "❌ No .env file found. Aborting."
  exit 1
fi

echo "🔍 Verifying environment from: $ENV_FILE"
echo

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Load .env file into environment
export $(grep -v '^#' "$ENV_FILE" | xargs)

# Pull required keys from .env.example
REQUIRED_KEYS=$(grep -v '^#' .env.example | cut -d '=' -f 1)

MISSING=0

echo "🧾 Required variables check:"
for KEY in $REQUIRED_KEYS; do
  VALUE=$(printenv "$KEY" | sed 's/^[ \t]*//;s/[ \t]*$//')
  if [[ -z "$VALUE" ]]; then
    echo -e "  ${RED}❌ $KEY is missing or empty${NC}"
    MISSING=1
  else
    echo -e "  ${GREEN}✅ $KEY present${NC}"
  fi
done

echo

# Validate next.config.ts existence
if [[ -f next.config.ts ]]; then
  echo -e "${GREEN}✅ next.config.ts found${NC}"
else
  echo -e "${YELLOW}⚠️ Warning: next.config.ts not found${NC}"
fi

# Final Result
if [[ "$MISSING" -eq 1 ]]; then
  echo -e "\n${RED}❌ Missing one or more required environment variables.${NC}"
  exit 1
else
  echo -e "\n${GREEN}✅ All environment variables are properly set.${NC}"
  exit 0
fi