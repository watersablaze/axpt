#!/bin/bash

# pnpm partner:debug      
# This will open http://localhost:3000/partner/token-debug in your default browser.

echo "🚀 Opening Token Debugger..."

# Try to open the token-debug page in the default browser
if command -v xdg-open > /dev/null; then
  xdg-open http://localhost:3000/partner/token-debug
elif command -v open > /dev/null; then
  open http://localhost:3000/partner/token-debug
else
  echo "🌐 Please open manually: http://localhost:3000/partner/token-debug"
fi