# === stripe-toggle.sh ===
#!/bin/bash

STRIPE_FILES=(
  "./lib/stripe.ts"
  "./app/api/payment/route.ts"
)

echo "\n🔁 STRIPE TOGGLE MENU"
echo "-----------------------"
echo "1. Disable Stripe (Rename to .temp.ts)"
echo "2. Enable Stripe (Rename back to .ts)"
echo "3. Exit"
echo "-----------------------"
read -p "Choose an option (1/2/3): " opt

case $opt in
  1)
    for file in "${STRIPE_FILES[@]}"; do
      [ -f "$file" ] && mv "$file" "${file%.ts}.temp.ts"
    done
    echo "✅ Stripe files disabled."
    ;;
  2)
    for file in "${STRIPE_FILES[@]}"; do
      [ -f "${file%.ts}.temp.ts" ] && mv "${file%.ts}.temp.ts" "$file"
    done
    echo "✅ Stripe files enabled."
    ;;
  3)
    echo "👋 Exiting Stripe toggle."
    ;;
  *)
    echo "❌ Invalid choice."
    ;;
esac