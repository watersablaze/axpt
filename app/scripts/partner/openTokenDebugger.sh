#!/bin/bash

# pnpm partner:debug      
# This will open ${LOCAL_DEV_DOMAIN}/partner/token-debug in your default browser.

echo "🚀 Opening Token Debugger..."

# Try to open the token-debug page in the default browser
if command -v xdg-open > /dev/null; then
  xdg-open ${LOCAL_DEV_DOMAIN}/partner/token-debug
elif command -v open > /dev/null; then
  open ${LOCAL_DEV_DOMAIN}/partner/token-debug
else
  echo "🌐 Please open manually: ${LOCAL_DEV_DOMAIN}/partner/token-debug"
fi