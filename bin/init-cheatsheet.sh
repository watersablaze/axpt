#!/bin/bash

# === AXPT | Cheat Sheet Generator ===
# Usage: chmod +x bin/init-cheatsheet.sh && bin/init-cheatsheet.sh

CHEATSHEET_PATH="bin/cheatsheet.txt"

mkdir -p bin

cat > "$CHEATSHEET_PATH" << 'EOF'
╭────────────────────────────────────────╮
│    ⟁  AXPT | TERMINAL CHEAT SHEET ⟁   │
╰────────────────────────────────────────╯
   ░ Rituals in motion ░

🧠 CLI Shortcuts:
 • preflight      → full validation, typecheck, build + env sync
 • deploy         → deploy via Vercel CLI or Git
 • push           → Git-only deploy helper
 • token          → create/verify/list partner tokens
 • tokenlive      → test tokens against LIVE secret
 • envsync        → sync .env secrets with Vercel
 • fixlock        → reset lockfile & node_modules

🪄 Token Usage:
 • token generate                     # Launch prompt
 • token generate --partner ron      # Shortcut for Ron
 • token verify <token>              # Verify locally
 • tokenlive <token>                 # Verify w/ Vercel secret
 • token list                        # View all partners
 • token lookup <name>              # Get partner’s tier

🚀 Typical Workflow:
  1. token generate
  2. preflight
  3. deploy --vercel
EOF

echo "✅ Cheat sheet generated at $CHEATSHEET_PATH"
