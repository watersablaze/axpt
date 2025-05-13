#!/bin/bash

# === AXPT | Canonical Scan CLI ===
# Usage: bin/scan-canonical-urls.sh

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color

log_match() {
  echo -e "$1" | sed "s/^/$2/"
}

scan() {
  echo -e "${BLUE}🔍 Scanning for canonical and URL-related anomalies...${NC}\n"

  echo -e "${YELLOW}1️⃣  Hardcoded 'localhost:3000' URLs:${NC}"
  grep -rniE 'http://localhost:3000' ./app ./bin ./public ./scripts ./lib 2>/dev/null | log_match "$YELLOW→ "

  echo -e "\n${YELLOW}2️⃣  Hardcoded 'axpt.io' URLs (non-www or legacy):${NC}"
  grep -rniE 'https?://(www\.)?axpt\.io' ./app ./bin ./public ./scripts ./lib 2>/dev/null | log_match "$YELLOW→ "

  echo -e "\n${YELLOW}3️⃣  Uses of \\${CANONICAL_DOMAIN}:${NC}"
  grep -rni '\${CANONICAL_DOMAIN}' ./app ./bin ./public ./scripts ./lib 2>/dev/null | log_match "$GREEN✔ "

  echo -e "\n${YELLOW}4️⃣  Uses of \\${LOCAL_DEV_DOMAIN}:${NC}"
  grep -rni '\${LOCAL_DEV_DOMAIN}' ./app ./bin ./public ./scripts ./lib 2>/dev/null | log_match "$GREEN✔ "

  echo -e "\n${YELLOW}5️⃣  Backup or temp files (e.g. .bak):${NC}"
  find ./app ./bin ./scripts ./lib -name '*.bak' 2>/dev/null | log_match "$RED⚠  "

  echo -e "\n${GREEN}✅ Scan complete.${NC}"
}

scan
