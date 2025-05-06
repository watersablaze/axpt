#!/bin/bash

# === AXPT Alias Patcher ===
# Timestamp: 2025-05-06_19-00-47
# Usage: chmod +x patch-aliases.sh && ./patch-aliases.sh

echo "🔧 Patching tsconfig.json and next.config.ts with new aliases..."

# === PATCH tsconfig.json ===
if [[ -f "tsconfig.json" ]]; then
  echo "✅ Updating paths in tsconfig.json..."

  # Use jq or sed to replace/add paths — here we assume paths block exists and overwrite it
  sed -i '' '/"paths": {/,/},/c\
        "paths": {\n          "@/*": ["*"],\n          "@/lib/*": ["lib/*"],\n          "@/components/*": ["components/*"],\n          "@/abi/*": ["../abi/*"]\n        },
  ' tsconfig.json

else
  echo "❌ tsconfig.json not found."
fi

# === PATCH next.config.ts ===
if [[ -f "next.config.ts" ]]; then
  echo "✅ Updating aliases in next.config.ts..."

  # Backup the original config
  cp next.config.ts next.config.backup.ts

  # Ensure alias block includes necessary mappings
  sed -i '' '/alias: {/,/},/c\
        alias: {\n          ...config.resolve?.alias,\n          "@": path.resolve(__dirname, "src"),\n          "@/lib": path.resolve(__dirname, "src/lib"),\n          "@/components": path.resolve(__dirname, "src/components"),\n          "@/abi": path.resolve(__dirname, "abi")\n        },
  ' next.config.ts

else
  echo "❌ next.config.ts not found."
fi

echo "🎯 Alias patching complete."
