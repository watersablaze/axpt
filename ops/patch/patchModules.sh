#!/bin/bash

echo "🔧 Starting auto-rename of problematic modules..."

if [ -f "app/api/create-payment-intent/route.ts" ]; then
  echo "🛠️ Renaming app/api/create-payment-intent/route.ts ➜ app/api/create-payment-intent/route.temp.ts"
  mv "app/api/create-payment-intent/route.ts" "app/api/create-payment-intent/route.temp.ts"
fi

if [ -f "app/api/dashboard/route.ts" ]; then
  echo "🛠️ Renaming app/api/dashboard/route.ts ➜ app/api/dashboard/route.temp.ts"
  mv "app/api/dashboard/route.ts" "app/api/dashboard/route.temp.ts"
fi

if [ -f "app/api/signup/route.ts" ]; then
  echo "🛠️ Renaming app/api/signup/route.ts ➜ app/api/signup/route.temp.ts"
  mv "app/api/signup/route.ts" "app/api/signup/route.temp.ts"
fi

if [ -f "app/api/stripe/deposit.ts" ]; then
  echo "🛠️ Renaming app/api/stripe/deposit.ts ➜ app/api/stripe/deposit.temp.ts"
  mv "app/api/stripe/deposit.ts" "app/api/stripe/deposit.temp.ts"
fi

if [ -f "app/api/stripe/transfer.ts" ]; then
  echo "🛠️ Renaming app/api/stripe/transfer.ts ➜ app/api/stripe/transfer.temp.ts"
  mv "app/api/stripe/transfer.ts" "app/api/stripe/transfer.temp.ts"
fi

if [ -f "app/api/transactions/filter.ts" ]; then
  echo "🛠️ Renaming app/api/transactions/filter.ts ➜ app/api/transactions/filter.temp.ts"
  mv "app/api/transactions/filter.ts" "app/api/transactions/filter.temp.ts"
fi

if [ -f "app/api/transactions/send.ts" ]; then
  echo "🛠️ Renaming app/api/transactions/send.ts ➜ app/api/transactions/send.temp.ts"
  mv "app/api/transactions/send.ts" "app/api/transactions/send.temp.ts"
fi

if [ -f "app/api/user/avatar/route.ts" ]; then
  echo "🛠️ Renaming app/api/user/avatar/route.ts ➜ app/api/user/avatar/route.temp.ts"
  mv "app/api/user/avatar/route.ts" "app/api/user/avatar/route.temp.ts"
fi

if [ -f "app/api/user/remove-avatar/route.ts" ]; then
  echo "🛠️ Renaming app/api/user/remove-avatar/route.ts ➜ app/api/user/remove-avatar/route.temp.ts"
  mv "app/api/user/remove-avatar/route.ts" "app/api/user/remove-avatar/route.temp.ts"
fi

if [ -f "app/api/user/route.ts" ]; then
  echo "🛠️ Renaming app/api/user/route.ts ➜ app/api/user/route.temp.ts"
  mv "app/api/user/route.ts" "app/api/user/route.temp.ts"
fi

if [ -f "app/api/user/upload-avatar/route.ts" ]; then
  echo "🛠️ Renaming app/api/user/upload-avatar/route.ts ➜ app/api/user/upload-avatar/route.temp.ts"
  mv "app/api/user/upload-avatar/route.ts" "app/api/user/upload-avatar/route.temp.ts"
fi

if [ -f "lib/auth.ts" ]; then
  echo "🛠️ Renaming lib/auth.ts ➜ lib/auth.temp.ts"
  mv "lib/auth.ts" "lib/auth.temp.ts"
fi

if [ -f "lib/contract.ts" ]; then
  echo "🛠️ Renaming lib/contract.ts ➜ lib/contract.temp.ts"
  mv "lib/contract.ts" "lib/contract.temp.ts"
fi

if [ -f "lib/stablecoin.ts" ]; then
  echo "🛠️ Renaming lib/stablecoin.ts ➜ lib/stablecoin.temp.ts"
  mv "lib/stablecoin.ts" "lib/stablecoin.temp.ts"
fi

if [ -f "lib/stripe.ts" ]; then
  echo "🛠️ Renaming lib/stripe.ts ➜ lib/stripe.temp.ts"
  mv "lib/stripe.ts" "lib/stripe.temp.ts"
fi

if [ -f "lib/prisma.ts" ]; then
  echo "🛠️ Renaming lib/prisma.ts ➜ lib/prisma.temp.ts"
  mv "lib/prisma.ts" "lib/prisma.temp.ts"
fi

if [ -f "lib/ethers.ts" ]; then
  echo "🛠️ Renaming lib/ethers.ts ➜ lib/ethers.temp.ts"
  mv "lib/ethers.ts" "lib/ethers.temp.ts"
fi

echo "✅ All known problematic modules renamed to .temp.ts"