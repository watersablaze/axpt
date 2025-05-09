#!/bin/bash

echo "🔍 ENVIRONMENT AUDIT REPORT"
echo "----------------------------"

ENV_VARS=("NEXT_PUBLIC_ENABLE_NEXTAUTH" "NEXT_PUBLIC_ENABLE_CLIENT_LAYOUT" "NEXT_PUBLIC_ENABLE_PRISMA" "NEXT_PUBLIC_ENABLE_STRIPE")

for var in "${ENV_VARS[@]}"; do
  value=$(grep "^$var=" .env.local | cut -d '=' -f2)
  echo "$var ➜ $value"
done

echo "✔️  Done. Check above values against stack-toggle expectations."