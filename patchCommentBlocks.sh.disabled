#!/bin/bash

echo "🛡️  Inserting comment block into all .temp.ts modules..."

COMMENT="// 🔒 Temporarily disabled for clean deploy."

FILES=(
  "app/api/create-payment-intent/route.temp.ts"
  "app/api/dashboard/route.temp.ts"
  "app/api/signup/route.temp.ts"
  "app/api/stripe/deposit.temp.ts"
  "app/api/stripe/transfer.temp.ts"
  "app/api/transactions/filter.temp.ts"
  "app/api/transactions/send.temp.ts"
  "app/api/user/avatar/route.temp.ts"
  "app/api/user/remove-avatar/route.temp.ts"
  "app/api/user/route.temp.ts"
  "app/api/user/upload-avatar/route.temp.ts"
  "lib/auth.temp.ts"
  "lib/contract.temp.ts"
  "lib/ethers.temp.ts"
  "lib/prisma.temp.ts"
  "lib/stablecoin.temp.ts"
  "lib/stripe.temp.ts"
)

for FILE in "${FILES[@]}"; do
  if [[ -f "$FILE" ]]; then
    echo "$COMMENT" | cat - "$FILE" > temp && mv temp "$FILE"
    echo "✅ Patched: $FILE"
  else
    echo "⚠️ Skipped (not found): $FILE"
  fi
done

echo "🎯 All comment blocks inserted."