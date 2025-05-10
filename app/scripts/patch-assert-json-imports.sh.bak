#!/bin/bash
# 🔧 Auto-patch all `assert { type: 'json' }` JSON imports across the project

echo "🔍 Scanning for JSON imports using 'assert { type: \"json\" }'..."

TARGET_DIRS=("app" "scripts")

for DIR in "${TARGET_DIRS[@]}"; do
  if [ -d "$DIR" ]; then
    FILES=$(grep -rl "assert { type: 'json' }" "$DIR")
    for FILE in $FILES; do
      echo "🛠️  Patching: $FILE"
      cp "$FILE" "$FILE.bak" # Backup
      sed -i '' "s/\s*assert\s*{\s*type:\s*'json'\s*}//g" "$FILE"
    done
  fi
done

echo "✅ All JSON imports patched. Backups saved as *.bak"