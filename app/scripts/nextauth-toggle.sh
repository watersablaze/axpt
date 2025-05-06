# === nextauth-toggle.sh ===
#!/bin/bash

NEXTAUTH_FILES=(
  "./components/SessionProviderWrapper.tsx"
  "./app/layout.tsx"
)

function toggle_nextauth() {
  echo "\n🔁 NEXTAUTH TOGGLE MENU"
  echo "-----------------------"
  echo "1. Disable NextAuth (Comment out lines)"
  echo "2. Enable NextAuth (Uncomment lines)"
  echo "3. Exit"
  echo "-----------------------"
  read -p "Choose an option (1/2/3): " opt

  case $opt in
    1)
      echo "🔒 Commenting out NextAuth integration..."
      for file in "${NEXTAUTH_FILES[@]}"; do
        [ -f "$file" ] && sed -i '' 's/^\([^\/]*\bSessionProvider\b.*\)/\/\/ \1/' "$file"
      done
      sed -i '' 's/^NEXT_PUBLIC_ENABLE_NEXTAUTH=true/NEXT_PUBLIC_ENABLE_NEXTAUTH=false/' .env.local
      echo "✅ NextAuth disabled."
      ;;
    2)
      echo "🔓 Uncommenting NextAuth integration..."
      for file in "${NEXTAUTH_FILES[@]}"; do
        [ -f "$file" ] && sed -i '' 's/^\/\/ \([^\/]*\bSessionProvider\b.*\)/\1/' "$file"
      done
      sed -i '' 's/^NEXT_PUBLIC_ENABLE_NEXTAUTH=false/NEXT_PUBLIC_ENABLE_NEXTAUTH=true/' .env.local
      echo "✅ NextAuth enabled."
      ;;
    3)
      echo "👋 Exiting NextAuth toggle."
      ;;
    *)
      echo "❌ Invalid choice."
      ;;
  esac
}

toggle_nextauth