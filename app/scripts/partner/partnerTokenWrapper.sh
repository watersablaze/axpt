#!/bin/bash

# 🌿 Ensure NVM is loaded
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 🎯 Use Node 20 (as required by AXPT)
nvm use 20 > /dev/null

# 🚀 Launch the token script using tsx
pnpm tsx app/scripts/partner/token.ts "$@"
