#!/usr/bin/env bash
set -e

BASE="http://localhost:3000"

echo "▶ Creating case…"
CASE_JSON=$(curl -s -X POST "$BASE/api/axpt/cases" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AXPT Canonical Walkthrough",
    "jurisdiction": "UAE (Dubai)",
    "mode": "ESCROW_FACILITATED",
    "status": "ACTIVE"
  }')

echo "$CASE_JSON" | jq .

CASE_ID=$(echo "$CASE_JSON" | jq -r '.case.id')

echo ""
echo "▶ Case ID: $CASE_ID"
echo ""

echo "▶ Fetching case…"
curl -s "$BASE/api/axpt/cases/$CASE_ID" | jq .

echo ""
echo "▶ DONE: Case created and retrievable"