#!/usr/bin/env bash

set -euo pipefail

echo
echo "════════════════════════════════════════════════════"
echo " AXPT — PUBLIC V1 RELEASE PREFLIGHT"
echo "════════════════════════════════════════════════════"

echo
echo "── 1. HOMEPAGE CONSTITUTION ──"
scripts/homepage/homepageRegressionGate.sh

echo
echo "── 2. STALE CONFIG LAW ──"

if [ -e next.config.backup.ts ]; then
  echo "ERROR: stale next.config.backup.ts remains"
  exit 1
fi

echo "✓ single Next configuration authority"

echo
echo "── 3. PUBLIC ROOT REDIRECT LAW ──"

if rg -n \
  'destination:\s*["'\'']\/landing["'\'']' \
  next.config.ts
then
  echo "ERROR: public root still redirects to /landing"
  exit 1
fi

echo "✓ / remains AXPT public front door"

echo
echo "── 4. PUBLIC METADATA ──"

rg -n \
  "AXPT — Axis Point|Coordination infrastructure for continuity" \
  app/layout.tsx

echo
echo "── 5. GLOBAL JITSI MUST BE ABSENT ──"

if rg -n \
  "meet\\.jit\\.si/external_api\\.js|next/script" \
  app/layout.tsx
then
  echo "ERROR: global Jitsi dependency remains"
  exit 1
fi

echo "✓ Jitsi removed from global root runtime"

echo
echo "── 6. DEVELOPMENT ARTIFACT CONTAINMENT ──"

if [ -e public/axpt-mobile-probe.html ]; then
  echo "ERROR: mobile probe remains publicly addressable"
  exit 1
fi

if rg -n \
  "MobileRuntimeDiagnostics|HydrationSentinel" \
  app/layout.tsx
then
  echo "ERROR: temporary runtime diagnostics remain mounted"
  exit 1
fi

echo "✓ temporary homepage QA artifacts absent"

echo
echo "── 7. DEPLOYMENT BANNER CONTAINMENT ──"

python3 - <<'PY'
from pathlib import Path

s = Path("app/layout.tsx").read_text()

if "<DeploymentBanner />" not in s:
    raise SystemExit(
        "ERROR: development banner component unexpectedly absent"
    )

if "const isDev = process.env.NODE_ENV === 'development'" not in s:
    raise SystemExit(
        "ERROR: development containment authority absent"
    )

print("✓ DeploymentBanner retained under development authority")
PY

echo
echo "── 8. PRISMA FORMAT CHECK ──"

pnpm exec prisma format --check

echo
echo "── 9. PRISMA VALIDATION ──"

pnpm exec prisma validate

echo
echo "── 10. TYPESCRIPT ──"

pnpm exec tsc --noEmit

echo
echo "── 11. PRODUCTION BUILD ──"

pnpm exec next build --webpack

echo
echo "── 12. DIFF INTEGRITY ──"

git diff --check


echo
echo "── 13. ADMIN DEV-BYPASS CONTAINMENT ──"

python3 - <<'PY'
from pathlib import Path

violations = []

for p in Path("app/api/admin").rglob("route.ts"):
    s = p.read_text()

    if (
        "x-dev-bypass" in s and
        "process.env.NODE_ENV === 'development'" not in s
    ):
        violations.append(str(p))

if violations:
    print(
        "ERROR: production-capable admin dev bypass:"
    )

    for item in violations:
        print(f"  {item}")

    raise SystemExit(1)

print(
    "✓ admin dev bypasses are development-only"
)
PY

echo
echo "════════════════════════════════════════════════════"
echo " ✓ AXPT PUBLIC V1 PREFLIGHT PASSED"
echo "════════════════════════════════════════════════════"
