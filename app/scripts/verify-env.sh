#!/bin/bash

# === AXPT | VERIFY ENV SCRIPT ===
# Description: Ensures required env vars are present, optionally sourcing from .env or .env.local

# Load .env or .env.local if not already loaded
if [ -z "$PARTNER_SECRET" ]; then
  if [ -f .env.local ]; then
    echo "📦 Loading from .env.local..."
    export $(grep -v '^#' .env.local | xargs)
  elif [ -f .env ]; then
    echo "📦 Loading from .env..."
    export $(grep -v '^#' .env | xargs)
  else
    echo "🚨 No .env or .env.local file found."
  fi
fi

# REQUIRED VARS
REQUIRED_VARS=(
  PARTNER_SECRET
)

# CHECK & REPORT
missing=()
echo "🔍 Verifying required environment variables..."
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing: $var"
    missing+=("$var")
  else
    echo "✅ Found: $var"
  fi

done

# FINAL STATUS
if [ ${#missing[@]} -ne 0 ]; then
  echo "\n🚫 One or more required environment variables are missing."
  echo "   Please define them in .env or export before running the tool."
  exit 1
else
  echo "\n🎉 Environment check passed."
fi
