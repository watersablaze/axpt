#!/bin/bash

echo ""
echo "📊 AXPT STACK STATUS DASHBOARD"
echo "────────────────────────────────────"

# Define each module toggle key and a label
declare -A modules
modules=(
  ["NEXT_PUBLIC_ENABLE_NEXTAUTH"]="NextAuth"
  ["NEXT_PUBLIC_ENABLE_PRISMA"]="Prisma"
  ["NEXT_PUBLIC_ENABLE_STRIPE"]="Stripe"
  ["NEXT_PUBLIC_ENABLE_CLIENT_LAYOUT"]="ClientLayoutWrapper"
)

# Read each env var from .env.local
for key in "${!modules[@]}"; do
  value=$(grep "^$key=" .env.local | cut -d '=' -f2 | tr '[:upper:]' '[:lower:]')
  label="${modules[$key]}"

  if [ "$value" == "true" ]; then
    echo "✅ $label is ENABLED"
  elif [ "$value" == "false" ]; then
    echo "❌ $label is DISABLED"
  else
    echo "⚠️  $label has UNKNOWN or unset state"
  fi
done

echo "────────────────────────────────────"
echo "🔁 Use './app/scripts/stack-toggle.sh' to toggle modules."
echo ""