import fs from "fs"
import path from "path"
import glob from "fast-glob"

const ROOT = process.cwd()

/**
 * 🧠 FILE MATCHERS
 */
const TARGETS = [
  "src/**/*.ts",
  "src/**/*.tsx",
  "app/**/*.ts",
  "app/**/*.tsx",
  "scripts/**/*.ts",
]

/**
 * ❌ LEGACY PATTERNS TO ELIMINATE
 */
const REPLACEMENTS: Array<[RegExp, string]> = [

  // ETK legacy API
  [/etkFromSignals\s*\(/g, "/* REMOVED: etfFromSignals */ etk.decide("],
  [/decideAndGate\s*\(/g, "decide("],
  [/ETKResult/g, "ETKResult"],

  // phantom ETK function usage
  [/etk\s*\(\s*signals/g, "etk.decide(spine"],

  // old signal → ctx confusion
  [/entityId\s*,\s*ctx/g, "entityId, ctx"],
]

/**
 * 🧠 IMPORT NORMALIZATION
 */
const IMPORT_FIXES: Array<[RegExp, string]> = [
  [
    /import\s+\{\s*etkFromSignals\s*\}\s+from\s+["'].*ETKSpineAdapter["']/g,
    `// REMOVED LEGACY SPINE ADAPTER`,
  ],
  [
    /import\s+\{\s*ExecutionTruthKernel\s*,\s*type\s*ETKResult\s*\}/g,
    `import { ExecutionTruthKernel, type ETKResult }`,
  ],
]

/**
 * 🧠 MAIN CLEANER
 */
function cleanFile(filePath: string) {
  let code = fs.readFileSync(filePath, "utf8")

  const original = code

  // 1. apply replacements
  for (const [pattern, replacement] of REPLACEMENTS) {
    code = code.replace(pattern, replacement)
  }

  // 2. fix imports
  for (const [pattern, replacement] of IMPORT_FIXES) {
    code = code.replace(pattern, replacement)
  }

  // 3. remove duplicate ETK calls artifacts
  code = code.replace(
    /etk\.decide\s*\(\s*signals\s*,\s*.*?\)/g,
    "etk.decide(spine)"
  )

  // 4. normalize stray broken call fragments
  code = code.replace(
    /\)\s*signals\s*,\s*entityId\s*,\s*ctx\s*\)/g,
    ")"
  )

  if (code !== original) {
    fs.writeFileSync(filePath, code, "utf8")
    console.log("✔ cleaned:", filePath)
  }
}

/**
 * 🧠 RUN SWEEP
 */
async function run() {
  const files = await glob(TARGETS, {
    absolute: true,
    ignore: ["node_modules", ".next", "dist"],
  })

  console.log("🧠 Contract Sweep Starting...")
  console.log(`Files scanned: ${files.length}`)

  for (const file of files) {
    cleanFile(file)
  }

  console.log("✅ Sweep Complete")
}

run().catch((err) => {
  console.error("❌ Sweep failed:", err)
  process.exit(1)
})