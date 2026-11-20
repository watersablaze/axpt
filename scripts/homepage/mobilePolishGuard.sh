#!/usr/bin/env bash

set -eo pipefail

cd "$(git rev-parse --show-toplevel)"

BASELINE="6b58f46bdefc2b6489aaf8216af75e7196de39e9"

SURFACES=(
  "src/components/surfaces/OriginSurface.module.css"
  "src/components/surfaces/FoundationSurface.module.css"
  "src/components/surfaces/FrameworkSurface.module.css"
  "src/components/surfaces/InterfacesSurface.module.css"
  "src/components/surfaces/EthosSurface.module.css"
  "src/components/surfaces/FrenchWardSurface.module.css"
  "src/components/surfaces/PresenceSurface.module.css"
)

TSX_SURFACES=(
  "src/components/surfaces/OriginSurface.tsx"
  "src/components/surfaces/FoundationSurface.tsx"
  "src/components/surfaces/FrameworkSurface.tsx"
  "src/components/surfaces/InterfacesSurface.tsx"
  "src/components/surfaces/EthosSurface.tsx"
  "src/components/surfaces/FrenchWardSurface.tsx"
  "src/components/surfaces/PresenceSurface.tsx"
)

echo
echo "════ AXPT R9 MOBILE POLISH GUARD ════"
echo
echo "desktop_baseline=$BASELINE"

git cat-file -e "${BASELINE}^{commit}"

echo
echo "── DESKTOP COMPONENT AUTHORITY ──"

for FILE in "${TSX_SURFACES[@]}"; do
  BASE_TMP="$(mktemp /tmp/axpt-mobile-guard-base.XXXXXX)"

  git show \
    "${BASELINE}:${FILE}" \
    > "$BASE_TMP"

  if ! cmp -s \
    "$BASE_TMP" \
    "$FILE"; then

    rm -f "$BASE_TMP"

    echo "ERROR: homepage component changed after desktop lock:"
    echo "  $FILE"
    echo
    echo "R9 mobile polish must not alter TSX without"
    echo "an explicit responsive-architecture exception."

    exit 1
  fi

  rm -f "$BASE_TMP"

  echo "✓ $FILE"
done

echo
echo "── STYLESHEET RESPONSIVE BOUNDARY ──"

python3 - \
  "$BASELINE" \
  "${SURFACES[@]}" <<'PY'
from pathlib import Path
import subprocess
import sys

baseline = sys.argv[1]
files = sys.argv[2:]


def baseline_text(path: str) -> str:
    result = subprocess.run(
        [
            "git",
            "show",
            f"{baseline}:{path}",
        ],
        check=True,
        capture_output=True,
        text=True,
    )

    return result.stdout


def normalize_eof(text: str) -> str:
    return text.rstrip() + "\n"


def strip_comments(text: str) -> str:
    out = []
    i = 0

    while i < len(text):
        if text.startswith("/*", i):
            end = text.find("*/", i + 2)

            if end == -1:
                raise SystemExit(
                    "R9_GUARD_UNTERMINATED_COMMENT"
                )

            i = end + 2
            continue

        out.append(text[i])
        i += 1

    return "".join(out)


def validate_appended_mobile_authority(
    path: str,
    appended: str,
) -> None:

    if "AXPT R9" not in appended:
        raise SystemExit(
            f"R9_GUARD_NON_R9_APPEND: {path}"
        )

    if "@media (min-width" in appended:
        raise SystemExit(
            f"R9_GUARD_DESKTOP_MEDIA_FOUND: {path}"
        )

    if "@media (max-width: 820px)" in appended:
        raise SystemExit(
            f"R9_GUARD_820_MEDIA_FOUND: {path}"
        )

    if "@media (max-width: 980px)" in appended:
        raise SystemExit(
            f"R9_GUARD_980_MEDIA_FOUND: {path}"
        )

    clean = strip_comments(appended)

    i = 0
    n = len(clean)

    while i < n:
        while (
            i < n
            and clean[i].isspace()
        ):
            i += 1

        if i >= n:
            break

        prefix = "@media (max-width: 680px)"

        if not clean.startswith(prefix, i):
            excerpt = clean[i:i + 100]

            raise SystemExit(
                "R9_GUARD_TOP_LEVEL_RULE_OUTSIDE_MOBILE: "
                f"{path}: {excerpt!r}"
            )

        i += len(prefix)

        while (
            i < n
            and clean[i].isspace()
        ):
            i += 1

        if (
            i >= n
            or clean[i] != "{"
        ):
            raise SystemExit(
                f"R9_GUARD_MEDIA_OPEN_MISSING: {path}"
            )

        depth = 0

        while i < n:
            char = clean[i]

            if char == "{":
                depth += 1

            elif char == "}":
                depth -= 1

                if depth == 0:
                    i += 1
                    break

                if depth < 0:
                    raise SystemExit(
                        f"R9_GUARD_BRACE_UNDERFLOW: {path}"
                    )

            i += 1

        if depth != 0:
            raise SystemExit(
                f"R9_GUARD_UNCLOSED_MEDIA: {path}"
            )


for path in files:
    current = Path(path).read_text()
    locked = baseline_text(path)

    if current == locked:
        print(f"✓ {path} — desktop baseline exact")
        continue

    locked_noeof = locked.rstrip()

    if not current.startswith(locked_noeof):
        raise SystemExit(
            "\n".join(
                [
                    "R9_GUARD_DESKTOP_PREFIX_CHANGED",
                    f"file: {path}",
                    "",
                    "The stylesheet no longer begins with",
                    "the exact desktop-lock authority.",
                    "",
                    "R9 permits append-only mobile authority.",
                ]
            )
        )

    appended = current[len(locked_noeof):]

    validate_appended_mobile_authority(
        path,
        appended,
    )

    print(
        f"✓ {path} — desktop locked / "
        "R9 mobile append isolated"
    )

print()
print(
    "✓ all homepage desktop stylesheet "
    "authority preserved"
)
PY

echo
echo "── DESKTOP REGRESSION GATE ──"

bash scripts/homepage/homepageRegressionGate.sh

echo
echo "✓ homepage regression gate passed"

echo
echo "════════════════════════════════════"
echo "✓ R9 MOBILE / DESKTOP ISOLATION PASSED"
echo "════════════════════════════════════"
