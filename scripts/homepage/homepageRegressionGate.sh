#!/usr/bin/env bash

set -euo pipefail

echo
echo "════ AXPT HOMEPAGE REGRESSION GATE ════"

ORIGIN="src/components/surfaces/OriginSurface.module.css"
HEADER="src/components/layout/Header.module.css"
INTERFACES="src/components/surfaces/InterfacesSurface.module.css"
ETHOS="src/components/surfaces/EthosSurface.module.css"
FW="src/components/surfaces/FrenchWardSurface.module.css"
LAYOUT="app/layout.tsx"
READY="src/components/system/DocumentReadyGate.tsx"

require() {
  local pattern="$1"
  local file="$2"
  local label="$3"

  if rg -q "$pattern" "$file"; then
    echo "✓ $label"
  else
    echo "ERROR: $label"
    echo "  missing: $pattern"
    echo "  file: $file"
    exit 1
  fi
}

echo
echo "── DOCUMENT READINESS ──"

require \
  "DocumentReadyGate" \
  "$LAYOUT" \
  "DocumentReadyGate mounted"

require \
  "visibility: 'hidden'" \
  "$LAYOUT" \
  "server paint barrier retained"

require \
  "documentReady = 'true'" \
  "$READY" \
  "readiness authority retained"

require \
  "scrollRestoration = 'manual'" \
  "$READY" \
  "browser scroll restoration disabled"

require \
  "window.location.hash" \
  "$READY" \
  "explicit anchor entry preserved"

require \
  "scrollTo\\(0, 0\\)" \
  "$READY" \
  "canonical Threshold entry retained"

echo
echo "── PRE-HYDRATION ENTRY AUTHORITY ──"

require \
  "data-entry-normalizing" \
  "$LAYOUT" \
  "pre-hydration homepage entry retained"

require \
  "scrollRestoration = 'manual'" \
  "$LAYOUT" \
  "pre-hydration restoration authority retained"

require \
  "scrollTo\\(0, 0\\)" \
  "$LAYOUT" \
  "pre-hydration Threshold position retained"


echo
echo "── THRESHOLD DESKTOP ──"

require \
  "thresholdDesktopCanonicalDeclaration" \
  "$ORIGIN" \
  "canonical declaration retained"

require \
  "thresholdDesktopCanonicalObservation" \
  "$ORIGIN" \
  "canonical observation retained"

require \
  "thresholdDesktopCanonicalCurrent" \
  "$ORIGIN" \
  "dotted registration retained"

require \
  "thresholdDesktopCanonicalResponse" \
  "$ORIGIN" \
  "institutional response retained"

require \
  "THRESHOLD DESKTOP D6" \
  "$ORIGIN" \
  "document-ready interlock retained"

echo
echo "── HEADER OPENING ──"

require \
  "headerSigilInstitutionRegister" \
  "$HEADER" \
  "sigil institutional registration retained"

require \
  "headerSigilFieldRegister" \
  "$HEADER" \
  "sigil field registration retained"

require \
  "3050ms" \
  "$HEADER" \
  "sigil response synchronization retained"

echo
echo "── THRESHOLD MOBILE ──"

require \
  "thresholdMobileSignalArrival" \
  "$ORIGIN" \
  "mobile declaration retained"

require \
  "thresholdMobileCurrentAfterSignal" \
  "$ORIGIN" \
  "mobile observation retained"

require \
  "thresholdMobileInstitutionArrival" \
  "$ORIGIN" \
  "mobile institutional response retained"

echo
echo "── INTERFACES ──"

require \
  "consequenceField" \
  "$INTERFACES" \
  "desktop consequence field retained"

require \
  "eventField" \
  "$INTERFACES" \
  "desktop action field retained"

require \
  "afterField" \
  "$INTERFACES" \
  "desktop after-action field retained"

echo
echo "── CIRCULATION ──"

require \
  "passageRule" \
  "$ETHOS" \
  "desktop passage rule retained"

require \
  "circulationFieldVisual" \
  "$ETHOS" \
  "mobile circulation organism retained"

echo
echo "── FRENCH-WARD ──"

require \
  "mobileSeal" \
  "$FW" \
  "mobile seal ownership retained"

echo
echo "── DIFF CHECK ──"

git diff --check -- \
  "$LAYOUT" \
  "$READY" \
  "$ORIGIN" \
  "$HEADER" \
  "$INTERFACES" \
  "$ETHOS" \
  "$FW"

echo
echo "════════════════════════════════════"
echo "✓ HOMEPAGE REGRESSION GATE PASSED"
echo "════════════════════════════════════"
