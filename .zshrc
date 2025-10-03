# AXPT Ritual Auto Check on Terminal Open
if [ -f "./app/scripts/ultraPreflightDeploy.sh" ]; then
  echo "🌀 Running AXPT ultraPreflightDeploy Check..."
  ./app/scripts/ultraPreflightDeploy.sh
fi

# ~/.zshrc — AXPT Ritual Shell Config

# Ensure Volta (if used)
export PATH="$HOME/.volta/bin:$PATH"

# NVM Initialization
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# PNPM Version Locking
# export PNPM_HOME="$HOME/Library/pnpm"
# export PATH="$PNPM_HOME:$PATH"

# ZSH Theme (optional)
ZSH_THEME="robbyrussell"

# Useful AXPT Aliases
alias preflight="sh ./app/scripts/ultraPreflightDeploy.sh"
alias onboard="pnpm exec tsx cli/onboard.ts"
alias doctor="pnpm exec tsx app/scripts/doctor.ts"
alias resetenv="sh ./app/scripts/reset-env.sh"

# Display confirmation
clear
echo "\n🌀 AXPT Ritual Shell Loaded — $(date)"
echo "Node: $(node -v)  |  PNPM: $(pnpm -v)"

nvm use 20.11.1 >/dev/null
export PATH="$(npm bin -g):$PATH"

