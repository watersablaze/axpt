#!/bin/bash

echo "🔍 Scanning for unauthorized next-auth usage..."

grep -rnw './' -e 'useSession' --exclude-dir=node_modules
grep -rnw './' -e 'getSession' --exclude-dir=node_modules

echo "✅ Scan complete."