#!/bin/bash

set -e

echo "🌀 AXPT Ritual Environment Reset Initiated..."

# --------------------------
# NODE: Enforce v20.11.1
# --------------------------
echo "🔧 Ensuring Node.js v20.11.1..."
if ! command -v nvm &> /dev/null; then
  echo "⚠️  NVM not found. Installing..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  source "$NVM_DIR/nvm.sh"
fi

nvm install 20.11.1
nvm use 20.11.1
echo "✅ Node version: $(node -v)"

# --------------------------
# PNPM: Enforce v8.15.5
# --------------------------
echo "🔧 Setting up PNPM v8.15.5..."
corepack disable pnpm || true
pnpm add -g pnpm@8.15.5

export PNPM_HOME="$HOME/Library/pnpm"
export PATH="$PNPM_HOME:$PATH"
echo 'export PNPM_HOME="$HOME/Library/pnpm"' >> ~/.zshrc
echo 'export PATH="$PNPM_HOME:$PATH"' >> ~/.zshrc
source ~/.zshrc

pnpm setup

echo "✅ PNPM version: $(pnpm -v)"

# --------------------------
# NVM Auto-switch in .zshrc
# --------------------------
if ! grep -q "load-nvmrc" ~/.zshrc; then
  echo "🧙🏾‍♀️ Installing NVM auto-switch hook in .zshrc..."
  cat << 'EOF' >> ~/.zshrc

autoload -U add-zsh-hook
load-nvmrc() {
  if nvm --version > /dev/null 2>&1 && [[ -f .nvmrc ]]; then
    nvm use > /dev/null
  fi
}
add-zsh-hook chpwd load-nvmrc
load-nvmrc
EOF
fi

# --------------------------
# Lock project versions
# --------------------------
echo "🔐 Locking versions in project root..."
echo "20.11.1" > .nvmrc
echo "pnpm=8.15.5" > .npmrc

# --------------------------
# Validate
# --------------------------
echo "📡 Final Environment Check..."
echo "Node: $(node -v)"
echo "PNPM: $(pnpm -v)"

echo "🎉 Environment is fully sanctified and ready for deployment rituals."
