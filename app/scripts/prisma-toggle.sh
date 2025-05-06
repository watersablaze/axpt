# === prisma-toggle.sh ===
#!/bin/bash

PRISMA_FILES=(
  "./app/api/user/route.ts"
  "./lib/prisma.ts"
)

echo "\n🔁 PRISMA TOGGLE MENU"
echo "-----------------------"
echo "1. Disable Prisma (Rename to .temp.ts)"
echo "2. Enable Prisma (Rename back to .ts)"
echo "3. Exit"
echo "-----------------------"
read -p "Choose an option (1/2/3): " opt

case $opt in
  1)
    for file in "${PRISMA_FILES[@]}"; do
      [ -f "$file" ] && mv "$file" "${file%.ts}.temp.ts"
    done
    echo "✅ Prisma files disabled."
    ;;
  2)
    for file in "${PRISMA_FILES[@]}"; do
      [ -f "${file%.ts}.temp.ts" ] && mv "${file%.ts}.temp.ts" "$file"
    done
    echo "✅ Prisma files enabled."
    ;;
  3)
    echo "👋 Exiting Prisma toggle."
    ;;
  *)
    echo "❌ Invalid choice."
    ;;
esac