#!/bin/bash

# 🔧 AXPT Stack Toggle Control Script

STACK_DIR="./app"
LAYOUT_FILE="$STACK_DIR/layout.tsx"
CLIENT_WRAPPER_FILE="./components/ClientLayoutWrapper.tsx"
SESSION_WRAPPER_FILE="./components/SessionProviderWrapper.tsx"
ENV_FILE=".env.local"

toggle_env_var() {
  key=$1
  new_value=$2
  sed -i '' "s/^${key}=.*/${key}=${new_value}/" "$ENV_FILE"
}

patch_layout_for_client_wrapper() {
  if grep -q 'ClientLayoutWrapper' "$LAYOUT_FILE"; then
    echo "✅ ClientLayoutWrapper already present."
  else
    echo "🔁 Patching layout.tsx with ClientLayoutWrapper..."
    sed -i '' '/<body className={inter.className}>/a\
        <ClientLayoutWrapper>
    ' "$LAYOUT_FILE"
    sed -i '' '/<\/body>/i\
        </ClientLayoutWrapper>
    ' "$LAYOUT_FILE"
  fi
}

toggle_session_wrapper() {
  if grep -q 'SessionProviderWrapper' "$CLIENT_WRAPPER_FILE"; then
    echo "🔁 Commenting SessionProviderWrapper in ClientLayoutWrapper..."
    sed -i '' 's/import { SessionProviderWrapper }.*$/\/\/ &/' "$CLIENT_WRAPPER_FILE"
    sed -i '' 's/<SessionProviderWrapper>/<>{/' "$CLIENT_WRAPPER_FILE"
    sed -i '' 's/<\/SessionProviderWrapper>/<\/>/' "$CLIENT_WRAPPER_FILE"
  else
    echo "🔁 Restoring SessionProviderWrapper in ClientLayoutWrapper..."
    sed -i '' 's/\/\/ import { SessionProviderWrapper.*/import { SessionProviderWrapper } from ".\/SessionProviderWrapper";/' "$CLIENT_WRAPPER_FILE"
    sed -i '' 's/<>{/<SessionProviderWrapper>/' "$CLIENT_WRAPPER_FILE"
    sed -i '' 's/<\/>/<\/SessionProviderWrapper>/' "$CLIENT_WRAPPER_FILE"
  fi
}

patch_modules() {
  echo "🔒 Toggling module routes (Prisma/Stripe) to .temp.ts..."
  find ./app -type f \( -name "*prisma.ts" -o -name "*stripe.ts" \) | while read -r file; do
    mv "$file" "${file%.ts}.temp.ts"
    echo "↪️ $file → ${file%.ts}.temp.ts"
  done
}

restore_modules() {
  echo "🔓 Restoring .temp.ts modules..."
  find ./app -type f -name "*.temp.ts" | while read -r file; do
    original="${file%.temp.ts}.ts"
    mv "$file" "$original"
    echo "↩️ $file → $original"
  done
}

show_menu() {
  echo "🧭 AXPT Stack Control:"
  echo "1. Enable NextAuth"
  echo "2. Disable NextAuth"
  echo "3. Toggle Prisma/Stripe Modules"
  echo "4. Toggle SessionProviderWrapper"
  echo "5. Toggle ClientLayoutWrapper"
  echo "6. Audit .env vs runtime"
  echo "7. Exit"
}

audit_env_runtime() {
  echo "📋 Auditing Runtime Stack Toggle State..."
  echo "ENV: NEXT_PUBLIC_ENABLE_NEXTAUTH=$(grep 'NEXT_PUBLIC_ENABLE_NEXTAUTH' $ENV_FILE)"
  echo "ClientWrapper in layout.tsx? $(grep -q 'ClientLayoutWrapper' $LAYOUT_FILE && echo 'Yes' || echo 'No')"
  echo "SessionWrapper active? $(grep -q 'SessionProviderWrapper' $CLIENT_WRAPPER_FILE && echo 'Yes' || echo 'No')"
  echo "Temp modules? $(find ./app -type f -name '*.temp.ts' | wc -l) found."
}

while true; do
  show_menu
  read -p "👉 Choose: " choice

  case $choice in
    1)
      toggle_env_var "NEXT_PUBLIC_ENABLE_NEXTAUTH" "true"
      patch_layout_for_client_wrapper
      restore_modules
      ;;
    2)
      toggle_env_var "NEXT_PUBLIC_ENABLE_NEXTAUTH" "false"
      patch_layout_for_client_wrapper
      patch_modules
      ;;
    3)
      echo "Toggling modules..."
      patch_modules
      ;;
    4)
      toggle_session_wrapper
      ;;
    5)
      patch_layout_for_client_wrapper
      ;;
    6)
      audit_env_runtime
      ;;
    7)
      echo "👋 Exiting..."
      break
      ;;
    *)
      echo "Invalid option."
      ;;
  esac
done