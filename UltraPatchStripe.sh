#!/bin/bash

echo "🧩 Ultra Patch: Temporarily removing Stripe integration..."

# Rename stripe lib file
if [ -f "lib/stripe.ts" ]; then
  mv lib/stripe.ts lib/stripe.temp.ts
  echo "✅ Renamed: lib/stripe.ts ➝ lib/stripe.temp.ts"
fi

# Rename all create-payment-intent API routes
if [ -f "app/api/create-payment-intent/route.ts" ]; then
  mv app/api/create-payment-intent/route.ts app/api/create-payment-intent/route.temp.ts
  echo "✅ Renamed: app/api/create-payment-intent/route.ts ➝ route.temp.ts"
fi

echo "🔒 Stripe dependency successfully patched for build."
