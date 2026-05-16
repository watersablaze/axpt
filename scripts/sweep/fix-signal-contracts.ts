import fs from "fs"
import path from "path"

const ROOT = "src"

function walk(dir: string): string[] {
  const out: string[] = []

  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file)

    if (fs.statSync(full).isDirectory()) {
      out.push(...walk(full))
    } else if (full.endsWith(".ts")) {
      out.push(full)
    }
  }

  return out
}

function fixFile(file: string) {
  let src = fs.readFileSync(file, "utf-8")

  let changed = false

  // 1. REMOVE invalid signal fields
  const forbiddenFields = ["decision:", "state:", "replayState:"]

  for (const f of forbiddenFields) {
    if (src.includes(f)) {
      src = src.replace(new RegExp(`${f}.*`, "g"), "")
      changed = true
    }
  }

  // 2. FIX raw string sources
  const sources = [
    "COGNITION",
    "DRIFT",
    "RISK",
    "RECONCILIATION",
    "DIVERGENCE",
  ]

  for (const s of sources) {
    const bad = new RegExp(`"${s}"`, "g")
    if (bad.test(src)) {
      src = src.replace(bad, `"${s}" as const`)
      changed = true
    }
  }

  // 3. FIX string[] inference
  src = src.replace(
    /(\[\s*"RISK"\s*,\s*"DRIFT"\s*\])/g,
    (m) => `${m} as const`
  )

  if (changed) {
    fs.writeFileSync(file, src)
    console.log("fixed:", file)
  }
}

const files = walk(ROOT)

for (const f of files) {
  fixFile(f)
}

console.log("signal contract sweep complete")