#!/bin/bash

echo "🧼 Starting AXPT structure cleanup..."

# === 1. Move useful files into authoritative locations ===
move_if_exists() {
  src="$1"
  dest="$2"
  if [ -d "$src" ]; then
    echo "📁 Moving contents of $src → $dest"
    mkdir -p "$dest"
    find "$src" -type f -exec mv -vn {} "$dest" \;
  fi
}

move_if_exists "lib" "app/src/lib"
move_if_exists "src" "app/src"
move_if_exists "app/hooks" "app/src/lib/hooks"
move_if_exists "public/lotties" "app/src/lotties"

# === 2. Backup old redundant directories ===
backup_if_exists() {
  dir="$1"
  if [ -d "$dir" ]; then
    echo "🗃️  Backing up $dir → ${dir}.bak"
    mv "$dir" "${dir}.bak"
  fi
}

backup_if_exists "lib"
backup_if_exists "src"
backup_if_exists "app/hooks"
backup_if_exists "public/lotties"

# === 3. Confirm migration complete ===
echo "✅ Migration complete. Please review .bak folders and run the alias patcher or restart your dev server."

